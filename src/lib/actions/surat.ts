"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireJabatan, requireLogin } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

const BULAN_ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

async function pastikanBolehLihatSurat() {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") throw new Error("Aksi ini khusus anggota HMIF.");
  if (konteks.is_superadmin) return konteks;
  if (konteks.nama_role !== "BPH") throw new Error("Modul Surat khusus BPH.");
  return konteks;
}

// ------------------------------------------------------------
// QUERY
// ------------------------------------------------------------

export async function daftarSurat(id_periode: string, filter?: { jenis?: string; bulan?: number }) {
  await pastikanBolehLihatSurat();
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("surat")
    .select(
      "id_surat, jenis, nomor_surat, perihal, tanggal_surat, asal_tujuan, url_dokumen, kategori_penerbit, kode_kegiatan"
    )
    .eq("id_periode", id_periode)
    .is("deleted_at", null)
    .order("tanggal_surat", { ascending: false });

  if (filter?.jenis) query = query.eq("jenis", filter.jenis);

  const { data } = await query;
  const hasil = (data ?? []).filter(
    (s) => !filter?.bulan || new Date(s.tanggal_surat).getMonth() + 1 === filter.bulan
  );
  return hasil;
}

export async function rekapPerBulan(id_periode: string) {
  await pastikanBolehLihatSurat();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("surat")
    .select("jenis, tanggal_surat")
    .eq("id_periode", id_periode)
    .is("deleted_at", null);

  const rekap: Record<string, { masuk: number; keluar: number }> = {};
  for (const s of data ?? []) {
    const bulan = new Date(s.tanggal_surat).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    if (!rekap[bulan]) rekap[bulan] = { masuk: 0, keluar: 0 };
    if (s.jenis === "Masuk") rekap[bulan].masuk++;
    else rekap[bulan].keluar++;
  }
  return rekap;
}

/**
 * Saran nomor urut surat Keluar berikutnya, sesuai Tata Cara Penulisan Nomor Surat HMIF:
 *   - Kepengurusan: XXX/KODE/HMIF-UNPERBA/ROMAWI/TAHUN -- nomor urut jalan terus
 *     selama periode kepengurusan masih aktif (reset di awal periode baru).
 *   - Kepanitiaan : XXX/KODE/PANPEL/KODE-KEGIATAN/ROMAWI/TAHUN -- nomor urut terpisah
 *     untuk TIAP kegiatan/kepanitiaan (bukan ikut periode maupun tahun kalender).
 */
export async function nomorSuratBerikutnya(
  id_periode: string,
  kategori_penerbit: "Kepengurusan" | "Kepanitiaan",
  kode_jenis_surat: string,
  kode_kegiatan?: string
): Promise<{ sukses: true; nomor: string } | { sukses: false; pesan: string }> {
  await pastikanBolehLihatSurat();
  const supabase = createServerSupabaseClient();

  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const romawi = BULAN_ROMAWI[sekarang.getMonth()];

  let query = supabase
    .from("surat")
    .select("id_surat", { count: "exact", head: true })
    .eq("jenis", "Keluar")
    .eq("kategori_penerbit", kategori_penerbit)
    .is("deleted_at", null);

  if (kategori_penerbit === "Kepengurusan") {
    query = query.eq("id_periode", id_periode);
  } else {
    if (!kode_kegiatan) {
      return { sukses: false, pesan: "Isi kode kegiatan dulu untuk melihat saran nomor." };
    }
    query = query.ilike("kode_kegiatan", kode_kegiatan);
  }

  const { count } = await query;
  const urutan = String((count ?? 0) + 1).padStart(3, "0");

  const nomor =
    kategori_penerbit === "Kepengurusan"
      ? `${urutan}/${kode_jenis_surat}/HMIF-UNPERBA/${romawi}/${tahun}`
      : `${urutan}/${kode_jenis_surat}/PANPEL/${(kode_kegiatan ?? "").toUpperCase()}/${romawi}/${tahun}`;

  return { sukses: true, nomor };
}

// ------------------------------------------------------------
// MUTASI
// ------------------------------------------------------------

export async function catatSurat(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireJabatan("Sekretaris");

  const id_periode = formData.get("id_periode") as string;
  const jenis = formData.get("jenis") as string;
  const nomor_surat = formData.get("nomor_surat") as string;
  const perihal = formData.get("perihal") as string;
  const tanggal_surat = formData.get("tanggal_surat") as string;
  const asal_tujuan = (formData.get("asal_tujuan") as string) || null;
  const url_dokumen = (formData.get("url_dokumen") as string) || null;
  const kategori_penerbit = (formData.get("kategori_penerbit") as string) || null;
  const kode_jenis_surat = (formData.get("kode_jenis_surat") as string) || null;
  const kode_kegiatan = (formData.get("kode_kegiatan") as string) || null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("surat").insert({
    id_periode,
    jenis,
    nomor_surat,
    perihal,
    tanggal_surat,
    asal_tujuan,
    url_dokumen,
    kategori_penerbit: jenis === "Keluar" ? kategori_penerbit : null,
    kode_jenis_surat: jenis === "Keluar" ? kode_jenis_surat : null,
    kode_kegiatan: jenis === "Keluar" && kategori_penerbit === "Kepanitiaan" ? kode_kegiatan?.toUpperCase() : null,
    dicatat_oleh: konteks.id_user,
  });

  if (error) return { sukses: false, pesan: "Gagal mencatat surat: " + error.message };
  return { sukses: true, pesan: "Surat berhasil dicatat." };
}
