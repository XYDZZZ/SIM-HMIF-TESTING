"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { buatSession } from "@/lib/auth/session";
import { requireJabatan } from "@/lib/auth/authorize";
import { skemaRegistrasiMitra, skemaLoginMitra } from "@/lib/validations/auth";
import type { HasilAksi } from "./auth";

/**
 * Pendaftaran Mitra — SATU-SATUNYA alur registrasi yang butuh approval.
 * Status awal "Menunggu", baru aktif setelah di-ACC Ketua/Waketu/Superadmin
 * (lihat acc_tolak_mitra di bawah).
 */
export async function registrasiMitra(formData: FormData): Promise<HasilAksi> {
  const parsed = skemaRegistrasiMitra.safeParse({
    nama_usaha: formData.get("nama_usaha"),
    nama_pemilik: formData.get("nama_pemilik"),
    kontak_whatsapp: formData.get("kontak_whatsapp"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("mitra")
    .select("id_mitra")
    .eq("username", data.username)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return { sukses: false, pesan: "Username ini sudah dipakai. Silakan pilih username lain." };
  }

  const password_hash = await hashPassword(data.password);

  const { error } = await supabase.from("mitra").insert({
    nama_usaha: data.nama_usaha,
    nama_pemilik: data.nama_pemilik,
    kontak_whatsapp: data.kontak_whatsapp,
    username: data.username,
    password_hash,
    status_pendaftaran: "Menunggu",
  });

  if (error) {
    return { sukses: false, pesan: "Gagal mendaftar: " + error.message };
  }

  return {
    sukses: true,
    pesan:
      "Pendaftaran mitra terkirim. Akun akan aktif setelah disetujui oleh pengurus HIMATIF " +
      "(biasanya dibahas dalam rapat internal terlebih dahulu).",
  };
}

export async function loginMitra(formData: FormData): Promise<HasilAksi> {
  const parsed = skemaLoginMitra.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabaseClient();
  const { data: mitra } = await supabase
    .from("mitra")
    .select("id_mitra, nama_usaha, password_hash, status_pendaftaran")
    .eq("username", parsed.data.username)
    .is("deleted_at", null)
    .maybeSingle();

  const pesanGagal = "Username atau password salah.";
  if (!mitra) return { sukses: false, pesan: pesanGagal };

  const cocok = await verifyPassword(parsed.data.password, mitra.password_hash);
  if (!cocok) return { sukses: false, pesan: pesanGagal };

  if (mitra.status_pendaftaran === "Menunggu") {
    return {
      sukses: false,
      pesan: "Pendaftaran Anda masih menunggu persetujuan pengurus HIMATIF.",
    };
  }
  if (mitra.status_pendaftaran === "Ditolak") {
    return { sukses: false, pesan: "Pendaftaran mitra Anda tidak disetujui. Hubungi pengurus HIMATIF." };
  }

  await buatSession({ id: mitra.id_mitra, tipe: "mitra", nama: mitra.nama_usaha });

  return { sukses: true, pesan: "Login berhasil." };
}

/**
 * ACC/Tolak pendaftaran mitra. Hanya Ketua, Wakil Ketua, atau Superadmin.
 */
export async function accTolakMitra(
  id_mitra: string,
  keputusan: "Disetujui" | "Ditolak"
): Promise<HasilAksi> {
  const konteks = await requireJabatan("Ketua", "Wakil Ketua");

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("mitra")
    .update({
      status_pendaftaran: keputusan,
      diproses_oleh: konteks.id_user,
      diproses_pada: new Date().toISOString(),
    })
    .eq("id_mitra", id_mitra);

  if (error) {
    return { sukses: false, pesan: "Gagal memproses: " + error.message };
  }

  return {
    sukses: true,
    pesan: keputusan === "Disetujui" ? "Mitra disetujui dan portalnya aktif." : "Pendaftaran mitra ditolak.",
  };
}
