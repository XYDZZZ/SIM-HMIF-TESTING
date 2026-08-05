import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Endpoint ping ringan -- dipanggil terjadwal (lihat .github/workflows/keep-alive.yml)
 * supaya Supabase free tier tidak menganggap project idle dan otomatis di-pause
 * (ambang batasnya 7 hari tanpa aktivitas API).
 *
 * Sengaja publik/tanpa autentikasi karena tujuannya cuma "membuktikan ada aktivitas",
 * bukan mengakses data apa pun yang sensitif -- query yang dijalankan seringan mungkin.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("roles").select("id_role").limit(1);
    return NextResponse.json({ status: "ok", waktu: new Date().toISOString() });
  } catch {
    // Tetap balas 200 -- tujuan endpoint ini cuma memicu aktivitas, bukan pelaporan error.
    return NextResponse.json({ status: "gagal_tapi_tidak_masalah" });
  }
}
