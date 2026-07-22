"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSuperadmin, requireJabatan } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

// ------------------------------------------------------------
// QUERY (baca data)
// ------------------------------------------------------------

export async function daftarPeriode() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("periode")
    .select("id_periode, nama_periode, tahun, status_aktif, dibuat_pada")
    .order("dibuat_pada", { ascending: false });
  return data ?? [];
}

export async function getPeriodeAktif() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("periode")
    .select("id_periode, nama_periode, tahun")
    .eq("status_aktif", true)
    .maybeSingle();
  return data;
}

export async function detailPeriode(id_periode: string) {
  const supabase = createServerSupabaseClient();

  const { data: periode } = await supabase
    .from("periode")
    .select("id_periode, nama_periode, tahun, status_aktif")
    .eq("id_periode", id_periode)
    .single();

  return { periode };
}

/** Anggota terdaftar (users) yang BELUM di-assign ke periode tertentu — buat form assign satuan. */
export async function calonAnggotaBelumDiassign(id_periode: string) {
  const supabase = createServerSupabaseClient();

  const { data: sudahAssign } = await supabase
    .from("anggota_periode")
    .select("id_user")
    .eq("id_periode", id_periode);

  const idSudah = new Set((sudahAssign ?? []).map((r) => r.id_user));

  const { data: semuaUser } = await supabase
    .from("users")
    .select("id_user, nim, nama_lengkap")
    .is("deleted_at", null)
    .order("nama_lengkap");

  const totalUserTerdaftar = semuaUser?.length ?? 0;
  const calon = (semuaUser ?? []).filter((u) => !idSudah.has(u.id_user));

  return { calon, totalUserTerdaftar };
}

/** Anggota dari periode LAIN (biasanya periode sebelumnya) untuk keperluan assign massal (carry-forward). */
export async function anggotaDariPeriodeLain(id_periode_saat_ini: string) {
  const supabase = createServerSupabaseClient();

  const { data: sudahAssign } = await supabase
    .from("anggota_periode")
    .select("id_user")
    .eq("id_periode", id_periode_saat_ini);
  const idSudah = new Set((sudahAssign ?? []).map((r) => r.id_user));

  const { data: periodeLain } = await supabase
    .from("periode")
    .select("id_periode, nama_periode")
    .neq("id_periode", id_periode_saat_ini)
    .order("dibuat_pada", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!periodeLain) return { dariPeriode: null, anggota: [] };

  const { data: barisMentah } = await supabase
    .from("anggota_periode")
    .select("id_user, id_role, id_jabatan, id_divisi")
    .eq("id_periode", periodeLain.id_periode);

  const kandidat = (barisMentah ?? []).filter((a) => !idSudah.has(a.id_user));
  if (kandidat.length === 0) return { dariPeriode: periodeLain, anggota: [] };

  const idUser = Array.from(new Set(kandidat.map((k) => k.id_user)));
  const idRole = Array.from(new Set(kandidat.map((k) => k.id_role).filter(Boolean)));
  const idJabatan = Array.from(new Set(kandidat.map((k) => k.id_jabatan).filter(Boolean)));
  const idDivisi = Array.from(new Set(kandidat.map((k) => k.id_divisi).filter(Boolean)));

  const [{ data: users }, { data: roles }, { data: jabatanList }, { data: divisiList }] = await Promise.all([
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
  ]);

  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));
  const petaRole = new Map((roles ?? []).map((r) => [r.id_role, r.nama_role]));
  const petaJabatan = new Map((jabatanList ?? []).map((j) => [j.id_jabatan, j.nama_jabatan]));
  const petaDivisi = new Map((divisiList ?? []).map((d) => [d.id_divisi, d.nama_divisi]));

  const belumDiassign = kandidat
    .map((k) => ({
      id_user: k.id_user,
      users: petaUser.get(k.id_user) ?? null,
      roles: k.id_role ? { nama_role: petaRole.get(k.id_role) ?? "" } : null,
      jabatan: k.id_jabatan ? { nama_jabatan: petaJabatan.get(k.id_jabatan) ?? "" } : null,
      divisi: k.id_divisi ? { nama_divisi: petaDivisi.get(k.id_divisi) ?? "" } : null,
    }))
    .filter((a) => a.users !== null);

  return { dariPeriode: periodeLain, anggota: belumDiassign };
}

export async function daftarRoleJabatanDivisi() {
  const supabase = createServerSupabaseClient();
  const [{ data: roles }, { data: jabatan }, { data: divisi }] = await Promise.all([
    supabase.from("roles").select("id_role, nama_role"),
    supabase.from("jabatan").select("id_jabatan, nama_jabatan"),
    supabase.from("divisi").select("id_divisi, nama_divisi"),
  ]);
  return { roles: roles ?? [], jabatan: jabatan ?? [], divisi: divisi ?? [] };
}

export async function detailAnggotaPeriode(id_anggota_periode: string) {
  const supabase = createServerSupabaseClient();

  const { data: baris } = await supabase
    .from("anggota_periode")
    .select("id_anggota_periode, id_user, id_periode, id_role, id_jabatan, id_divisi")
    .eq("id_anggota_periode", id_anggota_periode)
    .single();

  if (!baris) return null;

  const [{ data: user }, { data: periode }, { data: role }, { data: jabatanData }, { data: divisiData }] =
    await Promise.all([
      supabase
        .from("users")
        .select("nim, nama_lengkap, angkatan, tahun_masuk_organisasi, nomor_whatsapp")
        .eq("id_user", baris.id_user)
        .single(),
      supabase.from("periode").select("nama_periode").eq("id_periode", baris.id_periode).single(),
      baris.id_role
        ? supabase.from("roles").select("nama_role").eq("id_role", baris.id_role).maybeSingle()
        : Promise.resolve({ data: null }),
      baris.id_jabatan
        ? supabase.from("jabatan").select("nama_jabatan").eq("id_jabatan", baris.id_jabatan).maybeSingle()
        : Promise.resolve({ data: null }),
      baris.id_divisi
        ? supabase.from("divisi").select("nama_divisi").eq("id_divisi", baris.id_divisi).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const anggota = {
    id_anggota_periode: baris.id_anggota_periode,
    id_user: baris.id_user,
    id_periode: baris.id_periode,
    users: user,
    roles: role,
    jabatan: jabatanData,
    divisi: divisiData,
    periode,
  };

  const { data: poin } = await supabase
    .from("v_poin_keaktifan")
    .select("total_poin")
    .eq("id_user", anggota.id_user)
    .eq("id_periode", anggota.id_periode)
    .maybeSingle();

  return { anggota, total_poin: poin?.total_poin ?? 0 };
}

/**
 * Struktur kepengurusan lengkap untuk satu periode, dikelompokkan:
 * BPH (urut sesuai jabatan) -> per Divisi -> Kadiv lalu Anggota divisi itu.
 * Dipakai di halaman detail periode supaya seluruh jajaran pengurus
 * (dari BPH sampai anggota biasa) kelihatan jelas per tahun kepengurusan.
 */
export async function strukturKepengurusan(id_periode: string) {
  const supabase = createServerSupabaseClient();

  const { data: baris, error } = await supabase
    .from("anggota_periode")
    .select("id_anggota_periode, id_user, id_role, id_jabatan, id_divisi")
    .eq("id_periode", id_periode);

  if (error) {
    console.error("[strukturKepengurusan] gagal ambil anggota_periode:", error.message);
    return { bph: [], perDivisi: [], tanpaDivisi: [], totalAnggota: 0 };
  }

  const semuaBaris = baris ?? [];
  if (semuaBaris.length === 0) {
    return { bph: [], perDivisi: [], tanpaDivisi: [], totalAnggota: 0 };
  }

  const idUser = Array.from(new Set(semuaBaris.map((b) => b.id_user)));
  const idRole = Array.from(new Set(semuaBaris.map((b) => b.id_role).filter(Boolean)));
  const idJabatan = Array.from(new Set(semuaBaris.map((b) => b.id_jabatan).filter(Boolean)));
  const idDivisi = Array.from(new Set(semuaBaris.map((b) => b.id_divisi).filter(Boolean)));

  const [{ data: users }, { data: roles }, { data: jabatanList }, { data: divisiList }] = await Promise.all([
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
  ]);

  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));
  const petaRole = new Map((roles ?? []).map((r) => [r.id_role, r.nama_role]));
  const petaJabatan = new Map((jabatanList ?? []).map((j) => [j.id_jabatan, j.nama_jabatan]));
  const petaDivisi = new Map((divisiList ?? []).map((d) => [d.id_divisi, d.nama_divisi]));

  const semua = semuaBaris
    .map((b) => ({
      id_anggota_periode: b.id_anggota_periode,
      users: petaUser.get(b.id_user) ?? null,
      nama_role: b.id_role ? petaRole.get(b.id_role) ?? null : null,
      jabatan: b.id_jabatan ? { nama_jabatan: petaJabatan.get(b.id_jabatan) ?? "" } : null,
      divisi: b.id_divisi ? { nama_divisi: petaDivisi.get(b.id_divisi) ?? "" } : null,
    }))
    // Akun yang sudah di-nonaktifkan/dihapus (soft delete) tidak lagi ditampilkan
    // sebagai bagian struktur kepengurusan aktif.
    .filter((a) => a.users !== null);

  const urutanJabatan = ["Ketua", "Wakil Ketua", "Sekretaris", "Bendahara"];
  const bph = semua
    .filter((a) => a.nama_role === "BPH")
    .sort((a, b) => urutanJabatan.indexOf(a.jabatan?.nama_jabatan ?? "") - urutanJabatan.indexOf(b.jabatan?.nama_jabatan ?? ""));

  const namaDivisiUnik = Array.from(
    new Set(semua.map((a) => a.divisi?.nama_divisi).filter((n): n is string => Boolean(n)))
  );

  const perDivisi = namaDivisiUnik.map((namaDivisi) => {
    const anggotaDivisiIni = semua.filter((a) => a.divisi?.nama_divisi === namaDivisi);
    return {
      nama_divisi: namaDivisi,
      kadiv: anggotaDivisiIni.filter((a) => a.nama_role === "Kadiv"),
      anggota: anggotaDivisiIni.filter((a) => a.nama_role === "Anggota"),
    };
  });

  const tanpaDivisi = semua.filter((a) => a.nama_role !== "BPH" && !a.divisi?.nama_divisi);

  return { bph, perDivisi, tanpaDivisi, totalAnggota: semua.length };
}

/**
 * "Akhiri Periode & Buka Periode Baru" — khusus Superadmin.
 * Mengunci periode berjalan (read-only) dan langsung membuka periode baru
 * dalam satu transaksi. Memakai RPC Postgres supaya benar-benar atomik.
 */
export async function akhiriPeriodeBukaBaru(formData: FormData): Promise<HasilAksi> {
  await requireSuperadmin();

  const nama_periode = formData.get("nama_periode") as string;
  const tahun = Number(formData.get("tahun"));

  if (!nama_periode || !tahun) {
    return { sukses: false, pesan: "Nama periode dan tahun wajib diisi." };
  }

  const supabase = createServerSupabaseClient();

  // Matikan status_aktif periode yang sedang berjalan (kalau ada)
  const { error: errLama } = await supabase
    .from("periode")
    .update({ status_aktif: false })
    .eq("status_aktif", true);

  if (errLama) {
    return { sukses: false, pesan: "Gagal mengunci periode lama: " + errLama.message };
  }

  const { error: errBaru } = await supabase
    .from("periode")
    .insert({ nama_periode, tahun, status_aktif: true });

  if (errBaru) {
    return { sukses: false, pesan: "Gagal membuka periode baru: " + errBaru.message };
  }

  return {
    sukses: true,
    pesan: `Periode "${nama_periode}" berhasil dibuka. Periode sebelumnya kini bersifat baca-saja.`,
  };
}

/** Assign satu anggota (baru daftar / belum pernah masuk periode ini) ke suatu periode. */
export async function assignAnggotaPeriode(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireJabatan("Ketua", "Wakil Ketua");

  const id_periode = formData.get("id_periode") as string;
  const id_user = formData.get("id_user") as string;
  const id_role = formData.get("id_role") as string;
  const id_jabatan = (formData.get("id_jabatan") as string) || null;
  const id_divisi = (formData.get("id_divisi") as string) || null;

  const { periode } = await detailPeriode(id_periode);
  if (!periode?.status_aktif) {
    return { sukses: false, pesan: "Tidak bisa menambah anggota ke periode yang sudah terkunci." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("anggota_periode").insert({
    id_user,
    id_periode,
    id_role,
    id_jabatan,
    id_divisi,
    ditambahkan_oleh: konteks.id_user,
  });

  if (error) {
    return { sukses: false, pesan: "Gagal menambahkan anggota: " + error.message };
  }

  return { sukses: true, pesan: "Anggota berhasil ditambahkan ke periode ini." };
}

/**
 * Assign massal (carry-forward) — Opsi A. Menerima daftar id_user yang dicentang
 * beserta role/jabatan/divisi baru masing-masing, insert sekaligus ke periode aktif.
 */
export async function assignMassalPeriode(
  id_periode_baru: string,
  penugasan: Array<{ id_user: string; id_role: string; id_jabatan: string | null; id_divisi: string | null }>
): Promise<HasilAksi> {
  const konteks = await requireJabatan("Ketua", "Wakil Ketua");

  if (penugasan.length === 0) {
    return { sukses: false, pesan: "Pilih minimal satu anggota untuk dipindahkan." };
  }

  const supabase = createServerSupabaseClient();
  const baris = penugasan.map((p) => ({
    id_user: p.id_user,
    id_periode: id_periode_baru,
    id_role: p.id_role,
    id_jabatan: p.id_jabatan,
    id_divisi: p.id_divisi,
    ditambahkan_oleh: konteks.id_user,
  }));

  const { error } = await supabase.from("anggota_periode").insert(baris);

  if (error) {
    return { sukses: false, pesan: "Gagal memindahkan anggota: " + error.message };
  }

  return { sukses: true, pesan: `${penugasan.length} anggota berhasil dipindahkan ke periode ini.` };
}
