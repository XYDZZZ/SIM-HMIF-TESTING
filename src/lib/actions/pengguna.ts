"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/authorize";
import type { HasilAksi } from "./auth";

export async function daftarSemuaUser() {
  await requireSuperadmin();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("id_user, nim, nama_lengkap, angkatan, nomor_whatsapp, status, is_superadmin")
    .is("deleted_at", null)
    .order("nama_lengkap");
  return data ?? [];
}

/** Daftar penugasan periode aktif milik satu user -- untuk koreksi salah input role/jabatan/divisi. */
export async function daftarPenugasanUser(id_user: string) {
  await requireSuperadmin();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("anggota_periode")
    .select(
      "id_anggota_periode, id_role, id_jabatan, id_divisi, periode ( nama_periode, status_aktif ), roles ( nama_role ), jabatan ( nama_jabatan ), divisi ( nama_divisi )"
    )
    .eq("id_user", id_user)
    .order("ditambahkan_pada", { ascending: false });
  return data ?? [];
}

export async function updateUser(formData: FormData): Promise<HasilAksi> {
  await requireSuperadmin();

  const id_user = formData.get("id_user") as string;
  const nama_lengkap = formData.get("nama_lengkap") as string;
  const nim = formData.get("nim") as string;
  const angkatan = formData.get("angkatan") as string;
  const nomor_whatsapp = formData.get("nomor_whatsapp") as string;
  const status = formData.get("status") as string;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({ nama_lengkap, nim, angkatan, nomor_whatsapp, status })
    .eq("id_user", id_user);

  if (error) return { sukses: false, pesan: "Gagal memperbarui: " + error.message };
  return { sukses: true, pesan: "Data pengguna berhasil diperbarui." };
}

/** Soft delete akun -- tidak bisa dipakai ke diri sendiri, untuk mencegah Superadmin terkunci dari sistem. */
export async function hapusUser(id_user: string): Promise<HasilAksi> {
  const konteks = await requireSuperadmin();

  if (konteks.id_user === id_user) {
    return { sukses: false, pesan: "Anda tidak bisa menghapus akun Anda sendiri." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id_user", id_user);

  if (error) return { sukses: false, pesan: "Gagal menghapus: " + error.message };
  return { sukses: true, pesan: "Akun berhasil dihapus." };
}

/** Koreksi/hapus satu penugasan periode yang salah input (tanpa menghapus akun usernya). */
export async function hapusPenugasanPeriode(id_anggota_periode: string): Promise<HasilAksi> {
  await requireSuperadmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("anggota_periode").delete().eq("id_anggota_periode", id_anggota_periode);

  if (error) return { sukses: false, pesan: "Gagal menghapus penugasan: " + error.message };
  return { sukses: true, pesan: "Penugasan periode berhasil dihapus." };
}
