"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getKonteksPengguna, requireLogin } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

/**
 * Guard: menentukan apakah konteks pengguna saat ini boleh mengelola (CRUD)
 * proker dengan id_divisi tertentu.
 *   - id_divisi = null (proker bersama)  -> hanya BPH (atau Superadmin)
 *   - id_divisi = suatu divisi           -> hanya Kadiv divisi itu (atau Superadmin)
 */
async function pastikanBolehKelolaProker(id_divisi: string | null) {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") throw new Error("Aksi ini khusus anggota HIMATIF.");
  if (konteks.is_superadmin) return konteks;

  if (id_divisi === null) {
    if (konteks.nama_role !== "BPH") {
      throw new Error("Proker bersama hanya bisa dikelola oleh BPH.");
    }
  } else {
    if (konteks.nama_role !== "Kadiv" || konteks.id_divisi !== id_divisi) {
      throw new Error("Anda hanya bisa mengelola proker divisi Anda sendiri.");
    }
  }
  return konteks;
}

// ------------------------------------------------------------
// QUERY
// ------------------------------------------------------------

export async function daftarProker(id_periode: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("proker")
    .select("id_proker, nama_proker, status_proker, tanggal_mulai, tanggal_selesai, id_divisi, divisi ( nama_divisi )")
    .eq("id_periode", id_periode)
    .is("deleted_at", null)
    .order("tanggal_mulai", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function detailProker(id_proker: string) {
  const supabase = createServerSupabaseClient();
  const { data: proker } = await supabase
    .from("proker")
    .select(
      "id_proker, nama_proker, id_periode, id_divisi, status_proker, tanggal_mulai, tanggal_selesai, deskripsi, divisi ( nama_divisi ), periode ( status_aktif )"
    )
    .eq("id_proker", id_proker)
    .is("deleted_at", null)
    .single();

  const { data: dokumen } = await supabase
    .from("dokumen_proker")
    .select("id_dokumen, nama_dokumen, jenis_dokumen, url_dokumen, diunggah_pada")
    .eq("id_proker", id_proker)
    .is("deleted_at", null)
    .order("diunggah_pada", { ascending: false });

  return { proker, dokumen: dokumen ?? [] };
}

// ------------------------------------------------------------
// MUTASI
// ------------------------------------------------------------

export async function buatProker(formData: FormData): Promise<HasilAksi> {
  const id_periode = formData.get("id_periode") as string;
  const id_divisi = (formData.get("id_divisi") as string) || null;
  const nama_proker = formData.get("nama_proker") as string;
  const deskripsi = (formData.get("deskripsi") as string) || null;
  const tanggal_mulai = (formData.get("tanggal_mulai") as string) || null;
  const tanggal_selesai = (formData.get("tanggal_selesai") as string) || null;

  const konteks = await pastikanBolehKelolaProker(id_divisi);

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("proker").insert({
    nama_proker,
    id_periode,
    id_divisi,
    deskripsi,
    tanggal_mulai,
    tanggal_selesai,
    dibuat_oleh: konteks.id_user,
  });

  if (error) return { sukses: false, pesan: "Gagal membuat proker: " + error.message };
  return { sukses: true, pesan: "Proker berhasil dibuat." };
}

export async function updateStatusProker(id_proker: string, status_proker: string): Promise<HasilAksi> {
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("proker")
    .select("id_divisi")
    .eq("id_proker", id_proker)
    .single();
  if (!existing) return { sukses: false, pesan: "Proker tidak ditemukan." };

  await pastikanBolehKelolaProker(existing.id_divisi);

  const { error } = await supabase.from("proker").update({ status_proker }).eq("id_proker", id_proker);
  if (error) return { sukses: false, pesan: "Gagal memperbarui status." };
  return { sukses: true, pesan: "Status proker diperbarui." };
}

export async function tambahDokumenProker(formData: FormData): Promise<HasilAksi> {
  const id_proker = formData.get("id_proker") as string;
  const nama_dokumen = formData.get("nama_dokumen") as string;
  const jenis_dokumen = formData.get("jenis_dokumen") as string;
  const url_dokumen = formData.get("url_dokumen") as string;

  const supabase = createServerSupabaseClient();
  const { data: proker } = await supabase.from("proker").select("id_divisi").eq("id_proker", id_proker).single();
  if (!proker) return { sukses: false, pesan: "Proker tidak ditemukan." };

  const konteks = await pastikanBolehKelolaProker(proker.id_divisi);

  const { error } = await supabase.from("dokumen_proker").insert({
    id_proker,
    nama_dokumen,
    jenis_dokumen,
    url_dokumen,
    diunggah_oleh: konteks.id_user,
  });

  if (error) return { sukses: false, pesan: "Gagal menambahkan dokumen: " + error.message };
  return { sukses: true, pesan: "Dokumen berhasil ditambahkan." };
}
