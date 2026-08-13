"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireLogin } from "@/lib/auth/authorize";

async function pastikanBolehLihatLaporan() {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") throw new Error("Aksi ini khusus anggota HMIF.");
  if (konteks.is_superadmin) return konteks;
  if (konteks.nama_role !== "BPH") throw new Error("Laporan periode khusus BPH.");
  return konteks;
}

// ------------------------------------------------------------
// KEAKTIFAN
// ------------------------------------------------------------

/** Rekap poin keaktifan seluruh anggota dalam satu periode -- untuk BPH memantau & menerbitkan surat keterangan. */
export async function rekapKeaktifanPeriode(id_periode: string) {
  await pastikanBolehLihatLaporan();
  const supabase = createServerSupabaseClient();

  const { data: anggotaPeriode } = await supabase
    .from("anggota_periode")
    .select("id_anggota_periode, id_user, id_role, id_jabatan, id_divisi")
    .eq("id_periode", id_periode);

  const semua = anggotaPeriode ?? [];
  if (semua.length === 0) return [];

  const idUser = Array.from(new Set(semua.map((a) => a.id_user)));
  const idRole = Array.from(new Set(semua.map((a) => a.id_role).filter(Boolean)));
  const idJabatan = Array.from(new Set(semua.map((a) => a.id_jabatan).filter(Boolean)));
  const idDivisi = Array.from(new Set(semua.map((a) => a.id_divisi).filter(Boolean)));

  const [{ data: users }, { data: roles }, { data: jabatanList }, { data: divisiList }, { data: poin }] =
    await Promise.all([
      supabase.from("users").select("id_user, nim, nama_lengkap").in("id_user", idUser).is("deleted_at", null),
      idRole.length > 0
        ? supabase.from("roles").select("id_role, nama_role").in("id_role", idRole)
        : Promise.resolve({ data: [] as { id_role: string; nama_role: string }[] }),
      idJabatan.length > 0
        ? supabase.from("jabatan").select("id_jabatan, nama_jabatan").in("id_jabatan", idJabatan)
        : Promise.resolve({ data: [] as { id_jabatan: string; nama_jabatan: string }[] }),
      idDivisi.length > 0
        ? supabase.from("divisi").select("id_divisi, nama_divisi").in("id_divisi", idDivisi)
        : Promise.resolve({ data: [] as { id_divisi: string; nama_divisi: string }[] }),
      supabase.from("v_poin_keaktifan").select("id_user, total_poin").eq("id_periode", id_periode),
    ]);

  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));
  const petaRole = new Map((roles ?? []).map((r) => [r.id_role, r.nama_role]));
  const petaJabatan = new Map((jabatanList ?? []).map((j) => [j.id_jabatan, j.nama_jabatan]));
  const petaDivisi = new Map((divisiList ?? []).map((d) => [d.id_divisi, d.nama_divisi]));
  const petaPoin = new Map((poin ?? []).map((p) => [p.id_user, Number(p.total_poin)]));

  return semua
    .map((a) => ({
      id_anggota_periode: a.id_anggota_periode,
      users: petaUser.get(a.id_user) ?? null,
      nama_role: a.id_role ? petaRole.get(a.id_role) ?? null : null,
      nama_jabatan: a.id_jabatan ? petaJabatan.get(a.id_jabatan) ?? null : null,
      nama_divisi: a.id_divisi ? petaDivisi.get(a.id_divisi) ?? null : null,
      total_poin: petaPoin.get(a.id_user) ?? 0,
    }))
    .filter((a) => a.users !== null)
    .sort((a, b) => b.total_poin - a.total_poin);
}

/** Detail keaktifan satu anggota -- dasar Surat Keterangan Keaktifan yang bisa dicetak. */
export async function detailKeaktifanAnggota(id_anggota_periode: string) {
  const supabase = createServerSupabaseClient();

  const { data: baris } = await supabase
    .from("anggota_periode")
    .select("id_user, id_periode, id_jabatan, id_divisi")
    .eq("id_anggota_periode", id_anggota_periode)
    .single();
  if (!baris) return null;

  const [{ data: user }, { data: periode }, { data: jabatan }, { data: divisi }, { data: idKegiatanPeriode }] =
    await Promise.all([
      supabase.from("users").select("nim, nama_lengkap").eq("id_user", baris.id_user).single(),
      supabase.from("periode").select("nama_periode").eq("id_periode", baris.id_periode).single(),
      baris.id_jabatan
        ? supabase.from("jabatan").select("nama_jabatan").eq("id_jabatan", baris.id_jabatan).maybeSingle()
        : Promise.resolve({ data: null }),
      baris.id_divisi
        ? supabase.from("divisi").select("nama_divisi").eq("id_divisi", baris.id_divisi).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("kegiatan").select("id_kegiatan").eq("id_periode", baris.id_periode),
    ]);

  const setKegiatanPeriode = new Set((idKegiatanPeriode ?? []).map((k) => k.id_kegiatan));

  const { data: absensi } = await supabase
    .from("absensi")
    .select("id_kegiatan, status_kehadiran, kegiatan ( nama_kegiatan, waktu_mulai, bobot_poin )")
    .eq("id_user", baris.id_user)
    .in("status_kehadiran", ["Tepat Waktu", "Terlambat"]);

  const riwayat = (absensi ?? [])
    .filter((a) => setKegiatanPeriode.has(a.id_kegiatan))
    .map((a) => {
      const k = a.kegiatan as unknown as { nama_kegiatan: string; waktu_mulai: string; bobot_poin: number } | null;
      return {
        nama_kegiatan: k?.nama_kegiatan ?? "-",
        waktu_mulai: k?.waktu_mulai ?? null,
        bobot_poin: k?.bobot_poin ?? 0,
        status_kehadiran: a.status_kehadiran,
      };
    })
    .sort((a, b) => (a.waktu_mulai ?? "").localeCompare(b.waktu_mulai ?? ""));

  const totalPoin = riwayat.reduce((s, r) => s + Number(r.bobot_poin), 0);

  return {
    user,
    periode,
    jabatan,
    divisi,
    riwayat,
    totalPoin,
    totalKegiatan: riwayat.length,
  };
}

// ------------------------------------------------------------
// RANGKUMAN LPJ PROKER
// ------------------------------------------------------------

/** Kumpulan LPJ seluruh proker (yang sudah Selesai & LPJ-nya diisi) dalam satu periode. */
export async function rekapLPJPeriode(id_periode: string) {
  await pastikanBolehLihatLaporan();
  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from("proker")
    .select(
      "id_proker, nama_proker, status_proker, tanggal_mulai, tanggal_selesai, lpj_ringkasan, lpj_kendala, lpj_rekomendasi, lpj_url_dokumen, lpj_diisi_pada, divisi ( nama_divisi )"
    )
    .eq("id_periode", id_periode)
    .eq("status_proker", "Selesai")
    .order("tanggal_selesai", { ascending: true, nullsFirst: false });

  return data ?? [];
}
