import { getSession } from "./session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface KonteksAnggota {
  tipe: "anggota";
  id_user: string;
  nama_lengkap: string;
  is_superadmin: boolean;
  // Konteks periode aktif berjalan (null kalau user belum di-assign ke periode aktif mana pun)
  id_periode_aktif: string | null;
  id_role: string | null;
  nama_role: "BPH" | "Kadiv" | "Anggota" | null;
  nama_jabatan: string | null; // terisi hanya jika nama_role = BPH
  id_divisi: string | null; // terisi hanya jika nama_role = Kadiv/Anggota
}

export interface KonteksMitra {
  tipe: "mitra";
  id_mitra: string;
  nama_usaha: string;
}

export type Konteks = KonteksAnggota | KonteksMitra;

/**
 * Mengambil konteks otorisasi lengkap pengguna yang sedang login,
 * SELALU query fresh ke database (bukan dari klaim JWT), supaya
 * perubahan penugasan periode/role langsung ter-reflect tanpa perlu
 * logout-login ulang.
 *
 * Return null kalau tidak ada session valid.
 */
export async function getKonteksPengguna(): Promise<Konteks | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createServerSupabaseClient();

  if (session.tipe === "mitra") {
    const { data: mitra } = await supabase
      .from("mitra")
      .select("id_mitra, nama_usaha, status_pendaftaran")
      .eq("id_mitra", session.id)
      .is("deleted_at", null)
      .single();

    if (!mitra || mitra.status_pendaftaran !== "Disetujui") return null;

    return { tipe: "mitra", id_mitra: mitra.id_mitra, nama_usaha: mitra.nama_usaha };
  }

  // tipe === "anggota"
  const { data: user } = await supabase
    .from("users")
    .select("id_user, nama_lengkap, is_superadmin")
    .eq("id_user", session.id)
    .is("deleted_at", null)
    .single();

  if (!user) return null;

  const { data: periodeAktif } = await supabase
    .from("periode")
    .select("id_periode")
    .eq("status_aktif", true)
    .single();

  let id_role: string | null = null;
  let nama_role: KonteksAnggota["nama_role"] = null;
  let nama_jabatan: string | null = null;
  let id_divisi: string | null = null;

  if (periodeAktif) {
    const { data: anggotaPeriode } = await supabase
      .from("anggota_periode")
      .select(
        "id_role, id_divisi, roles(nama_role), jabatan(nama_jabatan)"
      )
      .eq("id_user", user.id_user)
      .eq("id_periode", periodeAktif.id_periode)
      .maybeSingle();

    if (anggotaPeriode) {
      id_role = anggotaPeriode.id_role;
      // @ts-expect-error -- hasil join Supabase berbentuk objek relasi
      nama_role = anggotaPeriode.roles?.nama_role ?? null;
      // @ts-expect-error -- hasil join Supabase berbentuk objek relasi
      nama_jabatan = anggotaPeriode.jabatan?.nama_jabatan ?? null;
      id_divisi = anggotaPeriode.id_divisi;
    }
  }

  return {
    tipe: "anggota",
    id_user: user.id_user,
    nama_lengkap: user.nama_lengkap,
    is_superadmin: user.is_superadmin,
    id_periode_aktif: periodeAktif?.id_periode ?? null,
    id_role,
    nama_role,
    nama_jabatan,
    id_divisi,
  };
}

// ------------------------------------------------------------
// Guard — dipanggil di awal tiap server action yang butuh proteksi.
// Melempar Error kalau tidak memenuhi syarat (ditangkap & ditampilkan
// sebagai pesan error di UI oleh pemanggilnya).
// ------------------------------------------------------------

export async function requireLogin(): Promise<Konteks> {
  const konteks = await getKonteksPengguna();
  if (!konteks) throw new Error("Anda harus login untuk melakukan aksi ini.");
  return konteks;
}

export async function requireSuperadmin(): Promise<KonteksAnggota> {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota" || !konteks.is_superadmin) {
    throw new Error("Aksi ini khusus Superadmin.");
  }
  return konteks;
}

export async function requireRole(
  ...allowedRoles: Array<"BPH" | "Kadiv" | "Anggota">
): Promise<KonteksAnggota> {
  const konteks = await requireLogin();
  if (konteks.tipe !== "anggota") {
    throw new Error("Aksi ini khusus anggota HIMATIF.");
  }
  // Superadmin selalu lolos guard role apa pun, sesuai posisinya sebagai developer-level access
  if (konteks.is_superadmin) return konteks;
  if (!konteks.nama_role || !allowedRoles.includes(konteks.nama_role)) {
    throw new Error("Anda tidak memiliki hak akses untuk aksi ini.");
  }
  return konteks;
}

export async function requireJabatan(
  ...allowedJabatan: string[]
): Promise<KonteksAnggota> {
  const konteks = await requireRole("BPH");
  if (konteks.is_superadmin) return konteks;
  if (!konteks.nama_jabatan || !allowedJabatan.includes(konteks.nama_jabatan)) {
    throw new Error("Aksi ini khusus jabatan tertentu di BPH.");
  }
  return konteks;
}

export async function requireMitra(): Promise<KonteksMitra> {
  const konteks = await requireLogin();
  if (konteks.tipe !== "mitra") {
    throw new Error("Aksi ini khusus akun Mitra.");
  }
  return konteks;
}
