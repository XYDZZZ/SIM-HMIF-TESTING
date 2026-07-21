import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase sisi server, pakai SERVICE ROLE KEY.
 *
 * PENTING: file ini hanya boleh diimpor dari kode yang jalan di server
 * (server actions, route handlers). Service role key bypass RLS sepenuhnya,
 * jadi seluruh validasi hak akses (siapa boleh apa) HARUS dilakukan manual
 * di level server action sebelum query dijalankan — lihat src/lib/auth/authorize.ts
 *
 * Jangan pernah impor file ini di komponen client ("use client").
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Konfigurasi Supabase belum lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL " +
        "dan SUPABASE_SERVICE_ROLE_KEY sudah diisi di .env.local"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
