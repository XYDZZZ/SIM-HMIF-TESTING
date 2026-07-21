"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

export async function daftarKegiatan(id_periode: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("kegiatan")
    .select("id_kegiatan, nama_kegiatan, waktu_mulai, bobot_poin, proker ( nama_proker )")
    .eq("id_periode", id_periode)
    .is("deleted_at", null)
    .order("waktu_mulai", { ascending: false });
  return data ?? [];
}

export async function detailKegiatan(id_kegiatan: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("kegiatan")
    .select(
      "id_kegiatan, nama_kegiatan, waktu_mulai, toleransi_menit, bobot_poin, id_periode, id_proker, proker ( nama_proker, id_divisi ), periode ( status_aktif )"
    )
    .eq("id_kegiatan", id_kegiatan)
    .is("deleted_at", null)
    .single();
  return data;
}

export async function daftarProkerUntukDropdown(id_periode: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("proker")
    .select("id_proker, nama_proker")
    .eq("id_periode", id_periode)
    .is("deleted_at", null)
    .order("nama_proker");
  return data ?? [];
}

export async function buatKegiatan(formData: FormData): Promise<HasilAksi> {
  const konteks = await requireRole("BPH");

  const id_periode = formData.get("id_periode") as string;
  const id_proker = (formData.get("id_proker") as string) || null;
  const nama_kegiatan = formData.get("nama_kegiatan") as string;
  const waktu_mulai = formData.get("waktu_mulai") as string;
  const toleransi_menit = Number(formData.get("toleransi_menit")) || 15;
  const bobot_poin = Number(formData.get("bobot_poin")) || 1;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("kegiatan").insert({
    nama_kegiatan,
    id_periode,
    id_proker,
    waktu_mulai,
    toleransi_menit,
    bobot_poin,
    dibuat_oleh: konteks.id_user,
  });

  if (error) return { sukses: false, pesan: "Gagal membuat kegiatan: " + error.message };
  return { sukses: true, pesan: "Kegiatan berhasil dibuat." };
}

/** Bobot poin bisa diubah kapan saja -- perubahan otomatis memengaruhi rekap poin (on-demand). */
export async function ubahBobotPoin(id_kegiatan: string, bobot_poin: number): Promise<HasilAksi> {
  await requireRole("BPH");

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("kegiatan").update({ bobot_poin }).eq("id_kegiatan", id_kegiatan);

  if (error) return { sukses: false, pesan: "Gagal mengubah bobot poin." };
  return { sukses: true, pesan: "Bobot poin berhasil diperbarui." };
}
