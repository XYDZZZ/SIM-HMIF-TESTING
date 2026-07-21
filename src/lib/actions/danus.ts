"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMitra } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

// ------------------------------------------------------------
// KATALOG
// ------------------------------------------------------------

export async function daftarKatalog() {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("danus_katalog")
    .select("id_produk, nama_item, harga_jual, persentase_margin_himatif, status")
    .eq("id_mitra", konteks.id_mitra)
    .is("deleted_at", null)
    .order("nama_item");
  return data ?? [];
}

export async function detailProduk(id_produk: string) {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();

  const { data: produk } = await supabase
    .from("danus_katalog")
    .select("id_produk, nama_item, harga_jual, persentase_margin_himatif, status")
    .eq("id_produk", id_produk)
    .eq("id_mitra", konteks.id_mitra)
    .single();

  const { data: resep } = await supabase
    .from("produk_bahan")
    .select("id_barang, jumlah_pemakaian, danus_stok ( nama_bahan, satuan )")
    .eq("id_produk", id_produk);

  return { produk, resep: resep ?? [] };
}

export async function buatProduk(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireMitra();

  const nama_item = formData.get("nama_item") as string;
  const harga_jual = Number(formData.get("harga_jual"));
  const persentase_margin_himatif = Number(formData.get("persentase_margin_himatif"));

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("danus_katalog").insert({
    id_mitra: konteks.id_mitra,
    nama_item,
    harga_jual,
    persentase_margin_himatif,
  });

  if (error) return { sukses: false, pesan: "Gagal menambah produk: " + error.message };
  return { sukses: true, pesan: "Produk berhasil ditambahkan." };
}

export async function ubahStatusProduk(id_produk: string, status: "Aktif" | "Nonaktif"): Promise<HasilAksi> {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("danus_katalog")
    .update({ status })
    .eq("id_produk", id_produk)
    .eq("id_mitra", konteks.id_mitra);

  if (error) return { sukses: false, pesan: "Gagal mengubah status." };
  return { sukses: true, pesan: "Status produk diperbarui." };
}

/** Menyimpan resep (bahan baku + jumlah pemakaian) untuk suatu produk -- replace penuh. */
export async function simpanResepProduk(
  id_produk: string,
  bahan: Array<{ id_barang: string; jumlah_pemakaian: number }>
): Promise<HasilAksi> {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();

  // Pastikan produk ini benar milik mitra yang login
  const { data: produk } = await supabase
    .from("danus_katalog")
    .select("id_produk")
    .eq("id_produk", id_produk)
    .eq("id_mitra", konteks.id_mitra)
    .maybeSingle();
  if (!produk) return { sukses: false, pesan: "Produk tidak ditemukan." };

  await supabase.from("produk_bahan").delete().eq("id_produk", id_produk);

  if (bahan.length > 0) {
    const { error } = await supabase.from("produk_bahan").insert(
      bahan.map((b) => ({ id_produk, id_barang: b.id_barang, jumlah_pemakaian: b.jumlah_pemakaian }))
    );
    if (error) return { sukses: false, pesan: "Gagal menyimpan resep: " + error.message };
  }

  return { sukses: true, pesan: "Resep produk berhasil disimpan." };
}

// ------------------------------------------------------------
// STOK
// ------------------------------------------------------------

export async function daftarStok() {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("danus_stok")
    .select("id_barang, nama_bahan, stok_saat_ini, batas_minimum, satuan")
    .eq("id_mitra", konteks.id_mitra)
    .is("deleted_at", null)
    .order("nama_bahan");
  return data ?? [];
}

export async function buatBahanStok(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireMitra();

  const nama_bahan = formData.get("nama_bahan") as string;
  const stok_saat_ini = Number(formData.get("stok_saat_ini")) || 0;
  const batas_minimum = Number(formData.get("batas_minimum")) || 0;
  const satuan = formData.get("satuan") as string;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("danus_stok").insert({
    id_mitra: konteks.id_mitra,
    nama_bahan,
    stok_saat_ini,
    batas_minimum,
    satuan,
  });

  if (error) return { sukses: false, pesan: "Gagal menambah bahan: " + error.message };
  return { sukses: true, pesan: "Bahan baku berhasil ditambahkan." };
}

/** Restock manual (jenis_pergerakan = Masuk), dicatat juga ke log_stok. */
export async function tambahStokMasuk(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireMitra();

  const id_barang = formData.get("id_barang") as string;
  const jumlah = Number(formData.get("jumlah"));

  const supabase = createServerSupabaseClient();

  const { data: barang } = await supabase
    .from("danus_stok")
    .select("stok_saat_ini")
    .eq("id_barang", id_barang)
    .eq("id_mitra", konteks.id_mitra)
    .single();
  if (!barang) return { sukses: false, pesan: "Bahan tidak ditemukan." };

  const { error: errUpdate } = await supabase
    .from("danus_stok")
    .update({ stok_saat_ini: Number(barang.stok_saat_ini) + jumlah })
    .eq("id_barang", id_barang);
  if (errUpdate) return { sukses: false, pesan: "Gagal menambah stok." };

  await supabase.from("log_stok").insert({
    id_barang,
    jenis_pergerakan: "Masuk",
    jumlah,
    keterangan: "Restock manual oleh mitra",
  });

  return { sukses: true, pesan: "Stok berhasil ditambahkan." };
}

// ------------------------------------------------------------
// TRANSAKSI (lewat RPC database -- atomik: hitung margin, potong stok, sinkron Kas)
// ------------------------------------------------------------

export async function daftarTransaksi() {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();

  // Ambil semua id_produk milik mitra ini dulu, karena danus_penjualan tidak
  // menyimpan id_mitra langsung (kepemilikan diturunkan lewat produk).
  const { data: produkMilik } = await supabase
    .from("danus_katalog")
    .select("id_produk")
    .eq("id_mitra", konteks.id_mitra);
  const idProduk = (produkMilik ?? []).map((p) => p.id_produk);
  if (idProduk.length === 0) return [];

  const { data } = await supabase
    .from("danus_penjualan")
    .select(
      "id_penjualan, kuantitas, total_omzet, hak_mitra, hak_himatif, waktu_transaksi, status_transaksi, danus_katalog ( nama_item )"
    )
    .in("id_produk", idProduk)
    .order("waktu_transaksi", { ascending: false });

  return data ?? [];
}

export async function buatTransaksi(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireMitra();

  const id_produk = formData.get("id_produk") as string;
  const kuantitas = Number(formData.get("kuantitas"));

  const supabase = createServerSupabaseClient();

  // Pastikan produk ini benar milik mitra yang login sebelum memanggil RPC
  const { data: produk } = await supabase
    .from("danus_katalog")
    .select("id_produk")
    .eq("id_produk", id_produk)
    .eq("id_mitra", konteks.id_mitra)
    .maybeSingle();
  if (!produk) return { sukses: false, pesan: "Produk tidak ditemukan." };

  const { data: id_penjualan, error } = await supabase.rpc("proses_transaksi_danus", {
    p_id_produk: id_produk,
    p_kuantitas: kuantitas,
    p_id_user_penerima: null,
  });

  if (error) return { sukses: false, pesan: "Gagal mencatat transaksi: " + error.message };

  return { sukses: true, pesan: `Transaksi berhasil dicatat. ID Struk: ${id_penjualan}` };
}

export async function batalkanTransaksi(id_penjualan: string, alasan: string): Promise<HasilAksi> {
  const konteks = await requireMitra();
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.rpc("batalkan_transaksi_danus", {
    p_id_penjualan: id_penjualan,
    p_id_mitra_pembatal: konteks.id_mitra,
    p_alasan: alasan,
  });

  if (error) return { sukses: false, pesan: "Gagal membatalkan: " + error.message };
  return { sukses: true, pesan: "Transaksi berhasil dibatalkan, stok dikembalikan." };
}

export async function detailStruk(id_penjualan: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("danus_penjualan")
    .select(
      "id_penjualan, kuantitas, total_omzet, waktu_transaksi, status_transaksi, danus_katalog ( nama_item, harga_jual, mitra ( nama_usaha ) )"
    )
    .eq("id_penjualan", id_penjualan)
    .single();
  return data;
}

// ------------------------------------------------------------
// OVERSIGHT -- khusus Ketua, Wakil Ketua, Sekretaris, Bendahara (read-only)
// ------------------------------------------------------------

async function pastikanBolehOversightDanus() {
  const { requireLogin } = await import("@/lib/auth/authorize");
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") throw new Error("Aksi ini khusus anggota HIMATIF.");
  if (konteks.is_superadmin) return konteks;

  const jabatanBoleh = ["Ketua", "Wakil Ketua", "Sekretaris", "Bendahara"];
  if (!konteks.nama_jabatan || !jabatanBoleh.includes(konteks.nama_jabatan)) {
    throw new Error("Anda tidak memiliki hak untuk melihat oversight Danus.");
  }
  return konteks;
}

export async function daftarSemuaMitra() {
  await pastikanBolehOversightDanus();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("mitra")
    .select("id_mitra, nama_usaha, nama_pemilik, kontak_whatsapp, status_pendaftaran")
    .is("deleted_at", null)
    .order("dibuat_pada", { ascending: false });
  return data ?? [];
}

export async function detailMitraOversight(id_mitra: string) {
  await pastikanBolehOversightDanus();
  const supabase = createServerSupabaseClient();

  const { data: mitra } = await supabase
    .from("mitra")
    .select("id_mitra, nama_usaha, nama_pemilik, kontak_whatsapp, status_pendaftaran")
    .eq("id_mitra", id_mitra)
    .single();

  const { data: katalog } = await supabase
    .from("danus_katalog")
    .select("id_produk, nama_item, harga_jual, persentase_margin_himatif, status")
    .eq("id_mitra", id_mitra)
    .is("deleted_at", null);

  const { data: stok } = await supabase
    .from("danus_stok")
    .select("id_barang, nama_bahan, stok_saat_ini, batas_minimum, satuan")
    .eq("id_mitra", id_mitra)
    .is("deleted_at", null);

  const idProduk = (katalog ?? []).map((k) => k.id_produk);
  let transaksi: Array<Record<string, unknown>> = [];
  if (idProduk.length > 0) {
    const { data } = await supabase
      .from("danus_penjualan")
      .select("id_penjualan, kuantitas, total_omzet, hak_himatif, waktu_transaksi, status_transaksi, danus_katalog ( nama_item )")
      .in("id_produk", idProduk)
      .order("waktu_transaksi", { ascending: false })
      .limit(50);
    transaksi = data ?? [];
  }

  return { mitra, katalog: katalog ?? [], stok: stok ?? [], transaksi };
}
