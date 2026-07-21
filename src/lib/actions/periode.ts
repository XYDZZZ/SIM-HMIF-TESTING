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

  const { data: anggota } = await supabase
    .from("anggota_periode")
    .select(
      `id_anggota_periode, id_user,
       users!id_user ( nim, nama_lengkap ),
       roles ( nama_role ),
       jabatan ( nama_jabatan ),
       divisi ( nama_divisi )`
    )
    .eq("id_periode", id_periode)
    .order("ditambahkan_pada", { ascending: true });

  return { periode, anggota: anggota ?? [] };
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

  const { data: anggota } = await supabase
    .from("anggota_periode")
    .select(
      `id_user, users!id_user ( nim, nama_lengkap ),
       roles ( nama_role ), jabatan ( nama_jabatan ), divisi ( nama_divisi )`
    )
    .eq("id_periode", periodeLain.id_periode);

  const belumDiassign = (anggota ?? []).filter((a) => !idSudah.has(a.id_user));

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

  const { data: anggota } = await supabase
    .from("anggota_periode")
    .select(
      `id_anggota_periode, id_user, id_periode,
       users!id_user ( nim, nama_lengkap, angkatan, tahun_masuk_organisasi, nomor_whatsapp ),
       roles ( nama_role ), jabatan ( nama_jabatan ), divisi ( nama_divisi ),
       periode ( nama_periode )`
    )
    .eq("id_anggota_periode", id_anggota_periode)
    .single();

  if (!anggota) return null;

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

  const { data: anggota } = await supabase
    .from("anggota_periode")
    .select(
      `id_anggota_periode, id_user,
       users!id_user ( nim, nama_lengkap ),
       roles ( nama_role ),
       jabatan ( id_jabatan, nama_jabatan ),
       divisi ( id_divisi, nama_divisi )`
    )
    .eq("id_periode", id_periode);

  const semua = anggota ?? [];

  const urutanJabatan = ["Ketua", "Wakil Ketua", "Sekretaris", "Bendahara"];
  const bph = semua
    .filter((a) => (a.roles as unknown as { nama_role: string } | null)?.nama_role === "BPH")
    .sort((a, b) => {
      const ja = (a.jabatan as unknown as { nama_jabatan: string } | null)?.nama_jabatan ?? "";
      const jb = (b.jabatan as unknown as { nama_jabatan: string } | null)?.nama_jabatan ?? "";
      return urutanJabatan.indexOf(ja) - urutanJabatan.indexOf(jb);
    });

  const namaDivisiUnik = Array.from(
    new Set(
      semua
        .map((a) => (a.divisi as unknown as { nama_divisi: string } | null)?.nama_divisi)
        .filter((n): n is string => Boolean(n))
    )
  );

  const perDivisi = namaDivisiUnik.map((namaDivisi) => {
    const anggotaDivisiIni = semua.filter(
      (a) => (a.divisi as unknown as { nama_divisi: string } | null)?.nama_divisi === namaDivisi
    );
    return {
      nama_divisi: namaDivisi,
      kadiv: anggotaDivisiIni.filter(
        (a) => (a.roles as unknown as { nama_role: string } | null)?.nama_role === "Kadiv"
      ),
      anggota: anggotaDivisiIni.filter(
        (a) => (a.roles as unknown as { nama_role: string } | null)?.nama_role === "Anggota"
      ),
    };
  });

  const tanpaDivisi = semua.filter(
    (a) =>
      (a.roles as unknown as { nama_role: string } | null)?.nama_role !== "BPH" &&
      !(a.divisi as unknown as { nama_divisi: string } | null)?.nama_divisi
  );

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
