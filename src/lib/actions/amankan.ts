import type { HasilAksi } from "@/lib/actions/auth";

/**
 * Membungkus body sebuah server action. Kalau ada error yang dilempar
 * (mis. dari requireLogin/requireRole/requireJabatan saat gagal validasi,
 * atau error tak terduga lain), otomatis ditangkap dan diubah jadi
 * HasilAksi{ sukses:false } yang rapi -- bukan exception mentah yang
 * bikin seluruh halaman crash ke layar error umum Next.js.
 */
export async function amankan(fn: () => Promise<HasilAksi>): Promise<HasilAksi> {
  try {
    return await fn();
  } catch (error) {
    return {
      sukses: false,
      pesan: error instanceof Error ? error.message : "Terjadi kesalahan tak terduga.",
    };
  }
}
