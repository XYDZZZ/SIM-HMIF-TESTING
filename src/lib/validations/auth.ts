import { z } from "zod";

export const skemaRegistrasi = z.object({
  nama_lengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  nim: z.string().min(5, "NIM tidak valid").max(30),
  angkatan: z.string().min(4, "Angkatan tidak valid").max(10),
  tahun_masuk_organisasi: z.string().min(4).max(10),
  password: z.string().min(8, "Password minimal 8 karakter"),
  nomor_whatsapp: z.string().min(9, "Nomor WhatsApp tidak valid").max(20),
});

export const skemaLogin = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const skemaLupaPassword = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  nama_lengkap: z.string().min(1, "Nama lengkap wajib diisi"),
});

export const skemaSetPasswordBaru = z.object({
  nim: z.string().min(1),
  nama_lengkap: z.string().min(1),
  password_baru: z.string().min(8, "Password minimal 8 karakter"),
});

export const skemaLoginMitra = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const skemaRegistrasiMitra = z.object({
  nama_usaha: z.string().min(3, "Nama usaha minimal 3 karakter"),
  nama_pemilik: z.string().min(3, "Nama pemilik minimal 3 karakter"),
  kontak_whatsapp: z.string().min(9, "Nomor WhatsApp tidak valid").max(20),
  username: z.string().min(4, "Username minimal 4 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});
