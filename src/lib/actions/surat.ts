"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireJabatan, requireLogin } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

const BULAN_ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

async function pastikanBolehLihatSurat() {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") throw new Error("Aksi ini khusus anggota HIMATIF.");
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
    .select("id_surat, jenis, nomor_surat, perihal, tanggal_surat, asal_tujuan, url_dokumen")
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

/** Saran nomor surat Keluar berikutnya, format: {urut}/HMIF/{bulan-romawi}/{tahun}. */
export async function nomorSuratBerikutnya(id_periode: string) {
  await pastikanBolehLihatSurat();
  const supabase = createServerSupabaseClient();

  const sekarang = new Date();
  const tahun = sekarang.getFullYear();

  const { count } = await supabase
    .from("surat")
    .select("id_surat", { count: "exact", head: true })
    .eq("id_periode", id_periode)
    .eq("jenis", "Keluar")
    .is("deleted_at", null)
    .gte("tanggal_surat", `${tahun}-01-01`)
    .lte("tanggal_surat", `${tahun}-12-31`);

  const urutan = String((count ?? 0) + 1).padStart(3, "0");
  return `${urutan}/HMIF/${BULAN_ROMAWI[sekarang.getMonth()]}/${tahun}`;
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

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("surat").insert({
    id_periode,
    jenis,
    nomor_surat,
    perihal,
    tanggal_surat,
    asal_tujuan,
    url_dokumen,
    dicatat_oleh: konteks.id_user,
  });

  if (error) return { sukses: false, pesan: "Gagal mencatat surat: " + error.message };
  return { sukses: true, pesan: "Surat berhasil dicatat." };
}
