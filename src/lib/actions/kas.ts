"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireJabatan, requireLogin } from "@/lib/auth/authorize";
import { uploadBuktiKas, buatUrlBukti, hapusBuktiKas } from "@/lib/supabase/storage";
import { amankan } from "./amankan";
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
export async function daftarKasTransaksi(
  id_periode: string,
  kategori?: string,
  subFilter?: { id_tagihan?: string; id_mitra?: string }
) {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("kas_transaksi")
    .select(
      `id_transaksi, id_user, jenis, kategori, nominal, metode_pembayaran, bukti_url, status,
       sumber_transaksi, dibuat_pada, diverifikasi_pada, id_penjualan,
       tagihan_khusus ( nama_tagihan )`
    )
    .is("deleted_at", null)
    .order("dibuat_pada", { ascending: false });

  if (kategori) query = query.eq("kategori", kategori);
  if (subFilter?.id_tagihan) query = query.eq("id_tagihan", subFilter.id_tagihan);

  if (subFilter?.id_mitra) {
    const { data: produkMitra } = await supabase
      .from("danus_katalog")
      .select("id_produk")
      .eq("id_mitra", subFilter.id_mitra);
    const idProduk = (produkMitra ?? []).map((p) => p.id_produk);

    const { data: penjualanMitra } = await supabase
      .from("danus_penjualan")
      .select("id_penjualan")
      .in("id_produk", idProduk.length > 0 ? idProduk : ["00000000-0000-0000-0000-000000000000"]);
    const idPenjualan = (penjualanMitra ?? []).map((p) => p.id_penjualan);

    query = query.in("id_penjualan", idPenjualan.length > 0 ? idPenjualan : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data } = await query;
  const semua = data ?? [];
  if (semua.length === 0) return [];

  const idUser = Array.from(new Set(semua.map((d) => d.id_user)));
  const { data: users } = await supabase.from("users").select("id_user, nama_lengkap").in("id_user", idUser);
  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));

  return semua.map((d) => ({ ...d, users: petaUser.get(d.id_user) ?? null }));
}

/** Daftar mitra ringkas (nama saja) untuk filter di dashboard Kas -- terbuka untuk semua, bukan oversight khusus. */
export async function daftarMitraRingkas() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("mitra")
    .select("id_mitra, nama_usaha")
    .eq("status_pendaftaran", "Disetujui")
    .is("deleted_at", null)
    .order("nama_usaha");
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
      `id_transaksi, id_user, nominal, metode_pembayaran, bukti_url, dibuat_pada,
       tagihan_khusus ( nama_tagihan )`
    )
    .eq("status", "Pending")
    .is("deleted_at", null)
    .order("dibuat_pada", { ascending: true });

  const semua = data ?? [];
  if (semua.length === 0) return [];

  const idUser = Array.from(new Set(semua.map((d) => d.id_user)));
  const { data: users } = await supabase.from("users").select("id_user, nama_lengkap, nim").in("id_user", idUser);
  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));

  return Promise.all(
    semua.map(async (d) => ({
      ...d,
      users: petaUser.get(d.id_user) ?? null,
      url_bukti_tampil: await buatUrlBukti(d.bukti_url),
    }))
  );
}

// ------------------------------------------------------------
// MUTASI
// ------------------------------------------------------------

export async function buatTagihanKhusus(formData: FormData): Promise<HasilAksi> {
  return amankan(async () => {
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
  });
}

/** Anggota mengajukan pembayaran (Transfer perlu bukti, status selalu Pending menunggu verifikasi). */
export async function ajukanPembayaranKas(formData: FormData): Promise<HasilAksi> {
  return amankan(async () => {
    const konteks = await requireLogin();
    if (konteks.tipe !== "anggota") return { sukses: false, pesan: "Aksi ini khusus anggota." };

    const kategori = formData.get("kategori") as string;
    const id_tagihan = (formData.get("id_tagihan") as string) || null;
    const nominal = Number(formData.get("nominal"));
    const file = formData.get("bukti_file") as File | null;

    if (!file || file.size === 0) {
      return { sukses: false, pesan: "Bukti transfer wajib diunggah." };
    }

    const folderKategori = kategori === "Kas Tagihan Khusus" ? "kas-tagihan-khusus" : "kas-rutin";
    const hasilUpload = await uploadBuktiKas(file, folderKategori);
    if (!hasilUpload.sukses) return { sukses: false, pesan: hasilUpload.pesan };

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("kas_transaksi").insert({
      id_user: konteks.id_user,
      jenis: "Masuk",
      kategori,
      id_tagihan,
      nominal,
      metode_pembayaran: "Transfer",
      bukti_url: hasilUpload.path,
      status: "Pending",
      sumber_transaksi: "Manual",
    });

    if (error) return { sukses: false, pesan: "Gagal mengajukan pembayaran: " + error.message };
    return { sukses: true, pesan: "Pembayaran terkirim, menunggu verifikasi Bendahara." };
  });
}

/** Bendahara mencatat pembayaran tunai langsung -- status Lunas seketika, tanpa perlu bukti. */
export async function inputTunaiBendahara(formData: FormData): Promise<HasilAksi> {
  return amankan(async () => {
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
  });
}

/** Daftar anggota periode aktif -- untuk dropdown "siapa yang bayar" di form tunai Bendahara. */
export async function daftarAnggotaUntukPembayaran(id_periode: string) {
  await requireJabatan("Bendahara");
  const supabase = createServerSupabaseClient();

  const { data: baris } = await supabase
    .from("anggota_periode")
    .select("id_user")
    .eq("id_periode", id_periode);

  const semua = baris ?? [];
  if (semua.length === 0) return [];

  const idUser = Array.from(new Set(semua.map((b) => b.id_user)));
  const { data: users } = await supabase
    .from("users")
    .select("id_user, nim, nama_lengkap")
    .in("id_user", idUser)
    .is("deleted_at", null);
  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));

  return semua
    .map((b) => ({ id_user: b.id_user, users: petaUser.get(b.id_user) ?? null }))
    .filter((a) => a.users !== null);
}

/** Bendahara mencatat pengeluaran kas. */
export async function inputPengeluaran(formData: FormData): Promise<HasilAksi> {
  return amankan(async () => {
    const konteks = await requireJabatan("Bendahara");

    const nominal = Number(formData.get("nominal"));
    const keterangan = formData.get("keterangan") as string;
    const bukti_file = formData.get("bukti_file") as File | null;
    let bukti_url: string | null = null;
    if (bukti_file && bukti_file.size > 0) {
      const hasilUpload = await uploadBuktiKas(bukti_file, "pengeluaran");
      if (!hasilUpload.sukses) return { sukses: false, pesan: hasilUpload.pesan };
      bukti_url = hasilUpload.path;
    }

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
  });
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

// ------------------------------------------------------------
// CRUD MANUAL BENDAHARA
// Khusus baris yang sumber_transaksi = 'Manual' (input tunai/pengeluaran).
// Baris 'Otomatis-Danus' TIDAK BOLEH diubah/dihapus lewat sini -- itu
// harus lewat alur pembatalan transaksi Danus supaya stok & kas tetap sinkron.
// ------------------------------------------------------------

export async function daftarKasManual() {
  await requireJabatan("Bendahara");
  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from("kas_transaksi")
    .select("id_transaksi, id_user, jenis, kategori, nominal, keterangan, status, dibuat_pada, bukti_url")
    .eq("sumber_transaksi", "Manual")
    .is("deleted_at", null)
    .order("dibuat_pada", { ascending: false });

  const semua = data ?? [];
  if (semua.length === 0) return [];

  const idUser = Array.from(new Set(semua.map((d) => d.id_user)));
  const { data: users } = await supabase.from("users").select("id_user, nama_lengkap").in("id_user", idUser);
  const petaUser = new Map((users ?? []).map((u) => [u.id_user, u]));

  return Promise.all(
    semua.map(async (d) => ({
      ...d,
      users: petaUser.get(d.id_user) ?? null,
      url_bukti_tampil: await buatUrlBukti(d.bukti_url),
    }))
  );
}

export async function updateTransaksiManual(formData: FormData): Promise<HasilAksi> {
  return amankan(async () => {
    await requireJabatan("Bendahara");

    const id_transaksi = formData.get("id_transaksi") as string;
    const id_user = (formData.get("id_user") as string) || null;
    const nominal = Number(formData.get("nominal"));
    const keterangan = (formData.get("keterangan") as string) || null;

    const supabase = createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("kas_transaksi")
      .select("sumber_transaksi")
      .eq("id_transaksi", id_transaksi)
      .single();

    if (!existing) return { sukses: false, pesan: "Transaksi tidak ditemukan." };
    if (existing.sumber_transaksi !== "Manual") {
      return { sukses: false, pesan: "Transaksi otomatis dari Danus tidak bisa diedit di sini." };
    }

    const update: Record<string, unknown> = { nominal, keterangan };
    if (id_user) update.id_user = id_user;

    const { error } = await supabase.from("kas_transaksi").update(update).eq("id_transaksi", id_transaksi);

    if (error) return { sukses: false, pesan: "Gagal memperbarui: " + error.message };
    return { sukses: true, pesan: "Transaksi berhasil diperbarui." };
  });
}

export async function hapusTransaksiManual(id_transaksi: string): Promise<HasilAksi> {
  await requireJabatan("Bendahara");

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("kas_transaksi")
    .select("sumber_transaksi")
    .eq("id_transaksi", id_transaksi)
    .single();

  if (!existing) return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  if (existing.sumber_transaksi !== "Manual") {
    return { sukses: false, pesan: "Transaksi otomatis dari Danus tidak bisa dihapus di sini." };
  }

  const { error } = await supabase
    .from("kas_transaksi")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id_transaksi", id_transaksi);

  if (error) return { sukses: false, pesan: "Gagal menghapus: " + error.message };
  return { sukses: true, pesan: "Transaksi berhasil dihapus." };
}
