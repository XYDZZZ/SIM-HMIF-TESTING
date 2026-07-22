"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireLogin } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

/**
 * Guard: siapa boleh mengelola absensi (scan/manual) untuk suatu kegiatan.
 *   - Superadmin & Sekretaris: selalu boleh
 *   - Kadiv: hanya jika kegiatan ini terikat ke proker milik divisinya sendiri
 *   - Lainnya: tidak boleh menulis (hanya lihat)
 */
async function pastikanBolehKelolaAbsensi(id_kegiatan: string) {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") throw new Error("Aksi ini khusus anggota HIMATIF.");
  if (konteks.is_superadmin) return konteks;
  if (konteks.nama_jabatan === "Sekretaris") return konteks;

  if (konteks.nama_role === "Kadiv") {
    const supabase = createServerSupabaseClient();
    const { data: kegiatan } = await supabase
      .from("kegiatan")
      .select("proker ( id_divisi )")
      .eq("id_kegiatan", id_kegiatan)
      .single();

    const idDivisiProker = (kegiatan?.proker as unknown as { id_divisi: string } | null)?.id_divisi;
    if (idDivisiProker && idDivisiProker === konteks.id_divisi) return konteks;
  }

  throw new Error("Anda tidak memiliki hak untuk mengelola absensi kegiatan ini.");
}

// ------------------------------------------------------------
// QUERY
// ------------------------------------------------------------

export async function daftarAbsensiKegiatan(id_kegiatan: string) {
  const supabase = createServerSupabaseClient();
  const { data: baris } = await supabase
    .from("absensi")
    .select("id_absensi, id_user, waktu_absen, status_kehadiran, metode_absen, catatan")
    .eq("id_kegiatan", id_kegiatan)
    .order("waktu_absen", { ascending: true, nullsFirst: false });

  const semua = baris ?? [];
  if (semua.length === 0) return [];

  const idUser = Array.from(new Set(semua.map((b) => b.id_user)));
  const { data: users } = await supabase.from("users").select("id_user, nim, nama_lengkap").in("id_user", idUser);
  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));

  return semua.map((b) => ({ ...b, users: petaUser.get(b.id_user) ?? null }));
}

/** Anggota periode aktif yang BELUM tercatat absensinya di kegiatan ini -- untuk dropdown input manual. */
export async function anggotaBelumAbsen(id_kegiatan: string, id_periode: string) {
  const supabase = createServerSupabaseClient();

  const { data: sudah } = await supabase.from("absensi").select("id_user").eq("id_kegiatan", id_kegiatan);
  const idSudah = new Set((sudah ?? []).map((a) => a.id_user));

  const { data: anggotaPeriode } = await supabase
    .from("anggota_periode")
    .select("id_user")
    .eq("id_periode", id_periode);

  const kandidat = (anggotaPeriode ?? []).filter((a) => !idSudah.has(a.id_user));
  if (kandidat.length === 0) return [];

  const idUser = Array.from(new Set(kandidat.map((k) => k.id_user)));
  const { data: users } = await supabase.from("users").select("id_user, nim, nama_lengkap").in("id_user", idUser);
  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));

  return kandidat.map((k) => ({ id_user: k.id_user, users: petaUser.get(k.id_user) ?? null }));
}

// ------------------------------------------------------------
// MUTASI
// ------------------------------------------------------------

/**
 * Algoritma inti scan QR kartu anggota. Dipanggil dari komponen scanner
 * setiap kali satu QR berhasil didekode.
 */
export async function prosesScan(kode_kartu: string, id_kegiatan: string): Promise<HasilAksi> {
  await pastikanBolehKelolaAbsensi(id_kegiatan);
  const supabase = createServerSupabaseClient();

  const { data: user } = await supabase
    .from("users")
    .select("id_user, nama_lengkap")
    .eq("kode_kartu", kode_kartu.trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    return { sukses: false, pesan: "Kartu tidak dikenali." };
  }

  const { data: sudahAda } = await supabase
    .from("absensi")
    .select("waktu_absen")
    .eq("id_kegiatan", id_kegiatan)
    .eq("id_user", user.id_user)
    .maybeSingle();

  if (sudahAda) {
    const jam = sudahAda.waktu_absen
      ? new Date(sudahAda.waktu_absen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-";
    return { sukses: false, pesan: `⚠️ ${user.nama_lengkap} sudah tercatat hadir pukul ${jam}.` };
  }

  const { data: kegiatan } = await supabase
    .from("kegiatan")
    .select("waktu_mulai, toleransi_menit")
    .eq("id_kegiatan", id_kegiatan)
    .single();

  if (!kegiatan) return { sukses: false, pesan: "Kegiatan tidak ditemukan." };

  const sekarang = new Date();
  const batasToleransi = new Date(
    new Date(kegiatan.waktu_mulai).getTime() + kegiatan.toleransi_menit * 60_000
  );
  const status = sekarang <= batasToleransi ? "Tepat Waktu" : "Terlambat";

  const { error } = await supabase.from("absensi").insert({
    id_kegiatan,
    id_user: user.id_user,
    waktu_absen: sekarang.toISOString(),
    status_kehadiran: status,
    metode_absen: "Scan",
  });

  // Kalau ada dua scan nyaris bersamaan lolos pengecekan di atas, UNIQUE constraint
  // di database akan menolak salah satunya sebagai lapis pengaman kedua.
  if (error) {
    if (error.code === "23505") {
      return { sukses: false, pesan: `⚠️ ${user.nama_lengkap} sudah tercatat hadir (terdeteksi ganda).` };
    }
    return { sukses: false, pesan: "Gagal mencatat kehadiran: " + error.message };
  }

  return { sukses: true, pesan: `${user.nama_lengkap} — ${status}` };
}

export async function inputManualAbsensi(formData: FormData): Promise<HasilAksi> {
  const id_kegiatan = formData.get("id_kegiatan") as string;
  const id_user = formData.get("id_user") as string;
  const status_kehadiran = formData.get("status_kehadiran") as string;
  const catatan = (formData.get("catatan") as string) || null;

  const konteks = await pastikanBolehKelolaAbsensi(id_kegiatan);
  const supabase = createServerSupabaseClient();

  const waktu_absen = ["Tepat Waktu", "Terlambat"].includes(status_kehadiran)
    ? new Date().toISOString()
    : null; // Izin/Sakit tidak punya waktu kehadiran fisik

  const { error } = await supabase.from("absensi").insert({
    id_kegiatan,
    id_user,
    waktu_absen,
    status_kehadiran,
    metode_absen: "Manual",
    diinput_oleh: konteks.id_user,
    catatan,
  });

  if (error) {
    if (error.code === "23505") {
      return { sukses: false, pesan: "Anggota ini sudah tercatat di kegiatan ini." };
    }
    return { sukses: false, pesan: "Gagal mencatat: " + error.message };
  }

  return { sukses: true, pesan: "Absensi manual berhasil dicatat." };
}
