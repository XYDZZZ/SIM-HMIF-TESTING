import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "bukti-kas";
const EKSTENSI_DIIZINKAN = ["jpg", "jpeg", "png", "heic", "heif", "webp"];
const UKURAN_MAKS_BYTES = 8 * 1024 * 1024; // 8MB, cukup longgar untuk foto kamera HP

export type KategoriBukti = "kas-rutin" | "kas-tagihan-khusus" | "pengeluaran";

/**
 * Upload file bukti (foto/screenshot) ke folder sesuai kategori.
 * Return path relatif (bukan URL) -- disimpan ke kolom bukti_url di database.
 * URL sesungguhnya (signed, sementara) baru dibuat saat mau ditampilkan,
 * lewat buatUrlBukti() di bawah.
 */
export async function uploadBuktiKas(
  file: File,
  kategori: KategoriBukti
): Promise<{ sukses: true; path: string } | { sukses: false; pesan: string }> {
  if (file.size === 0) {
    return { sukses: false, pesan: "File bukti wajib diunggah." };
  }
  if (file.size > UKURAN_MAKS_BYTES) {
    return { sukses: false, pesan: "Ukuran file maksimal 8MB." };
  }

  const ekstensi = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EKSTENSI_DIIZINKAN.includes(ekstensi)) {
    return {
      sukses: false,
      pesan: `Format file tidak didukung. Gunakan: ${EKSTENSI_DIIZINKAN.join(", ")}.`,
    };
  }

  const namaFile = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ekstensi}`;
  const path = `${kategori}/${namaFile}`;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type || undefined });

  if (error) {
    return { sukses: false, pesan: "Gagal mengunggah file: " + error.message };
  }

  return { sukses: true, path };
}

/** Membuat URL sementara (berlaku 1 jam) untuk menampilkan bukti yang tersimpan di bucket privat. */
export async function buatUrlBukti(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function hapusBuktiKas(path: string | null): Promise<void> {
  if (!path) return;
  const supabase = createServerSupabaseClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
