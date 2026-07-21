"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { buatSession, hapusSession } from "@/lib/auth/session";
import { generateKodeKartu } from "@/lib/auth/kartu";
import {
  skemaRegistrasi,
  skemaLogin,
  skemaLupaPassword,
  skemaSetPasswordBaru,
} from "@/lib/validations/auth";

export interface HasilAksi {
  sukses: boolean;
  pesan: string;
}

/**
 * Registrasi anggota baru. TIDAK ada approval — begitu sukses, akun
 * langsung bisa dipakai login (sesuai keputusan desain). kode_kartu
 * digenerate SAAT INI JUGA, bukan menunggu approval/assignment periode,
 * karena identitas kartu melekat ke orang, bukan ke status keanggotaan.
 */
export async function registrasiAnggota(formData: FormData): Promise<HasilAksi> {
  const parsed = skemaRegistrasi.safeParse({
    nama_lengkap: formData.get("nama_lengkap"),
    nim: formData.get("nim"),
    angkatan: formData.get("angkatan"),
    tahun_masuk_organisasi: formData.get("tahun_masuk_organisasi"),
    password: formData.get("password"),
    nomor_whatsapp: formData.get("nomor_whatsapp"),
  });

  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const supabase = createServerSupabaseClient();

  // Cek NIM sudah terdaftar atau belum (di antara akun yang masih aktif)
  const { data: existing } = await supabase
    .from("users")
    .select("id_user")
    .eq("nim", data.nim)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return { sukses: false, pesan: "NIM ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password." };
  }

  const password_hash = await hashPassword(data.password);
  const kode_kartu = generateKodeKartu();

  const { error } = await supabase.from("users").insert({
    nama_lengkap: data.nama_lengkap,
    nim: data.nim,
    angkatan: data.angkatan,
    tahun_masuk_organisasi: data.tahun_masuk_organisasi,
    password_hash,
    nomor_whatsapp: data.nomor_whatsapp,
    kode_kartu,
  });

  if (error) {
    return { sukses: false, pesan: "Gagal mendaftar: " + error.message };
  }

  return {
    sukses: true,
    pesan: "Registrasi berhasil! Silakan login menggunakan NIM dan password Anda.",
  };
}

export async function loginAnggota(formData: FormData): Promise<HasilAksi> {
  const parsed = skemaLogin.safeParse({
    nim: formData.get("nim"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id_user, nama_lengkap, password_hash, status")
    .eq("nim", parsed.data.nim)
    .is("deleted_at", null)
    .maybeSingle();

  // Pesan generik supaya tidak membocorkan NIM mana yang valid (mencegah enumerasi akun)
  const pesanGagal = "NIM atau password salah.";

  if (!user) return { sukses: false, pesan: pesanGagal };
  if (user.status !== "Aktif") {
    return { sukses: false, pesan: "Akun Anda berstatus nonaktif. Hubungi Superadmin/BPH." };
  }

  const cocok = await verifyPassword(parsed.data.password, user.password_hash);
  if (!cocok) return { sukses: false, pesan: pesanGagal };

  await buatSession({ id: user.id_user, tipe: "anggota", nama: user.nama_lengkap });

  return { sukses: true, pesan: "Login berhasil." };
}

/**
 * Lupa password — self-service, verifikasi hanya via NIM + Nama Lengkap
 * (tanpa OTP/email, sesuai keputusan: organisasi kecil & saling kenal).
 * Langkah 1: verifikasi kecocokan data.
 */
export async function verifikasiLupaPassword(formData: FormData): Promise<HasilAksi> {
  const parsed = skemaLupaPassword.safeParse({
    nim: formData.get("nim"),
    nama_lengkap: formData.get("nama_lengkap"),
  });

  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id_user")
    .eq("nim", parsed.data.nim)
    .ilike("nama_lengkap", parsed.data.nama_lengkap.trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    return { sukses: false, pesan: "Data tidak ditemukan. Periksa kembali NIM dan Nama Lengkap Anda." };
  }

  return { sukses: true, pesan: "Data cocok. Silakan buat password baru." };
}

/** Langkah 2: set password baru setelah verifikasi langkah 1 berhasil. */
export async function setPasswordBaru(formData: FormData): Promise<HasilAksi> {
  const parsed = skemaSetPasswordBaru.safeParse({
    nim: formData.get("nim"),
    nama_lengkap: formData.get("nama_lengkap"),
    password_baru: formData.get("password_baru"),
  });

  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id_user")
    .eq("nim", parsed.data.nim)
    .ilike("nama_lengkap", parsed.data.nama_lengkap.trim())
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    return { sukses: false, pesan: "Verifikasi gagal, ulangi dari awal." };
  }

  const password_hash = await hashPassword(parsed.data.password_baru);
  const { error } = await supabase
    .from("users")
    .update({ password_hash, harus_ganti_password: false })
    .eq("id_user", user.id_user);

  if (error) {
    return { sukses: false, pesan: "Gagal menyimpan password baru." };
  }

  return { sukses: true, pesan: "Password berhasil diubah. Silakan login." };
}

export async function logout(): Promise<void> {
  await hapusSession();
}
