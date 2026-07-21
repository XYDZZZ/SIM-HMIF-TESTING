"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireJabatan, requireLogin } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

// ------------------------------------------------------------
// QUERY
// ------------------------------------------------------------

export async function daftarTagihanKhusus(id_periode: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("tagihan_khusus")
    .select("id_tagihan, nama_tagihan, nominal, deadline")
    .eq("id_periode", id_periode)
    .is("deleted_at", null)
    .order("deadline", { ascending: true, nullsFirst: false });
  return data ?? [];
}

/**
 * Daftar transaksi kas untuk dashboard transparansi -- bisa dilihat SEMUA anggota
 * (bukan cuma Bendahara), sesuai prinsip transparansi yang disepakati.
 */
export async function daftarKasTransaksi(id_periode: string, kategori?: string) {
  const supabase = createServerSupabaseClient();

  // Ambil semua kegiatan/tagihan/kegiatan pada periode ini dulu tidak diperlukan --
  // kas_transaksi tidak punya id_periode langsung, jadi kita filter lewat tagihan_khusus
  // untuk kategori itu, dan untuk Kas Rutin/Danus kita tampilkan semua (tidak terikat periode
  // secara ketat karena users bersifat permanen). Supaya tetap relevan, batasi lewat tanggal
  // pembuatan periode aktif ke depan tidak diberlakukan di versi ini -- ditampilkan semua
  // transaksi terbaru dan bisa difilter kategori.

  let query = supabase
    .from("kas_transaksi")
    .select(
      `id_transaksi, jenis, kategori, nominal, metode_pembayaran, bukti_url, status,
       sumber_transaksi, dibuat_pada, diverifikasi_pada,
       users!id_user ( nama_lengkap ), tagihan_khusus ( nama_tagihan )`
    )
    .is("deleted_at", null)
    .order("dibuat_pada", { ascending: false });

  if (kategori) query = query.eq("kategori", kategori);

  const { data } = await query;
  return data ?? [];
}

export async function ringkasanKas() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("kas_transaksi")
    .select("jenis, nominal")
    .eq("status", "Lunas")
    .is("deleted_at", null);

  const totalMasuk = (data ?? []).filter((d) => d.jenis === "Masuk").reduce((s, d) => s + Number(d.nominal), 0);
  const totalKeluar = (data ?? []).filter((d) => d.jenis === "Keluar").reduce((s, d) => s + Number(d.nominal), 0);

  return { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar };
}

export async function daftarKasPending() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("kas_transaksi")
    .select(
      `id_transaksi, nominal, metode_pembayaran, bukti_url, dibuat_pada,
       users!id_user ( nama_lengkap, nim ), tagihan_khusus ( nama_tagihan )`
    )
    .eq("status", "Pending")
    .is("deleted_at", null)
    .order("dibuat_pada", { ascending: true });
  return data ?? [];
}

// ------------------------------------------------------------
// MUTASI
// ------------------------------------------------------------

export async function buatTagihanKhusus(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireJabatan("Bendahara");

  const nama_tagihan = formData.get("nama_tagihan") as string;
  const nominal = Number(formData.get("nominal"));
  const id_periode = formData.get("id_periode") as string;
  const deadline = (formData.get("deadline") as string) || null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("tagihan_khusus").insert({
    nama_tagihan,
    nominal,
    id_periode,
    deadline,
    dibuat_oleh: konteks.id_user,
  });

  if (error) return { sukses: false, pesan: "Gagal membuat tagihan: " + error.message };
  return { sukses: true, pesan: "Tagihan khusus berhasil dibuat." };
}

/** Anggota mengajukan pembayaran (Transfer perlu bukti, status selalu Pending menunggu verifikasi). */
export async function ajukanPembayaranKas(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") return { sukses: false, pesan: "Aksi ini khusus anggota." };

  const kategori = formData.get("kategori") as string;
  const id_tagihan = (formData.get("id_tagihan") as string) || null;
  const nominal = Number(formData.get("nominal"));
  const bukti_url = (formData.get("bukti_url") as string) || null;

  if (!bukti_url) {
    return { sukses: false, pesan: "Bukti transfer wajib diunggah." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("kas_transaksi").insert({
    id_user: konteks.id_user,
    jenis: "Masuk",
    kategori,
    id_tagihan,
    nominal,
    metode_pembayaran: "Transfer",
    bukti_url,
    status: "Pending",
    sumber_transaksi: "Manual",
  });

  if (error) return { sukses: false, pesan: "Gagal mengajukan pembayaran: " + error.message };
  return { sukses: true, pesan: "Pembayaran terkirim, menunggu verifikasi Bendahara." };
}

/** Bendahara mencatat pembayaran tunai langsung -- status Lunas seketika. */
export async function inputTunaiBendahara(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireJabatan("Bendahara");

  const id_user = formData.get("id_user") as string;
  const kategori = formData.get("kategori") as string;
  const id_tagihan = (formData.get("id_tagihan") as string) || null;
  const nominal = Number(formData.get("nominal"));

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("kas_transaksi").insert({
    id_user,
    jenis: "Masuk",
    kategori,
    id_tagihan,
    nominal,
    metode_pembayaran: "Tunai",
    status: "Lunas",
    sumber_transaksi: "Manual",
    diverifikasi_oleh: konteks.id_user,
    diverifikasi_pada: new Date().toISOString(),
  });

  if (error) return { sukses: false, pesan: "Gagal mencatat: " + error.message };
  return { sukses: true, pesan: "Pembayaran tunai berhasil dicatat." };
}

/** Bendahara mencatat pengeluaran kas. */
export async function inputPengeluaran(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireJabatan("Bendahara");

  const nominal = Number(formData.get("nominal"));
  const keterangan = formData.get("keterangan") as string;
  const bukti_url = (formData.get("bukti_url") as string) || null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("kas_transaksi").insert({
    id_user: konteks.id_user,
    jenis: "Keluar",
    kategori: "Kas Rutin",
    nominal,
    bukti_url,
    keterangan,
    status: "Lunas",
    sumber_transaksi: "Manual",
    diverifikasi_oleh: konteks.id_user,
    diverifikasi_pada: new Date().toISOString(),
  });

  if (error) return { sukses: false, pesan: "Gagal mencatat pengeluaran: " + error.message };
  return { sukses: true, pesan: "Pengeluaran berhasil dicatat." };
}

export async function verifikasiKas(id_transaksi: string, keputusan: "Lunas" | "Ditolak"): Promise<HasilAksi> {
  const konteks = await requireJabatan("Bendahara");

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("kas_transaksi")
    .update({ status: keputusan, diverifikasi_oleh: konteks.id_user, diverifikasi_pada: new Date().toISOString() })
    .eq("id_transaksi", id_transaksi);

  if (error) return { sukses: false, pesan: "Gagal memverifikasi: " + error.message };
  return { sukses: true, pesan: keputusan === "Lunas" ? "Pembayaran diverifikasi Lunas." : "Pembayaran ditolak." };
}
