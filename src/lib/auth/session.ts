import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "himatif_session";
const SESSION_DURATION_DETIK = 60 * 60 * 24 * 7; // 7 hari

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET belum diatur di environment variable");
  }
  return new TextEncoder().encode(secret);
}

export type TipeAkun = "anggota" | "mitra";

export interface SessionPayload {
  id: string; // id_user ATAU id_mitra, tergantung field `tipe`
  tipe: TipeAkun;
  nama: string;
}

/**
 * Membuat session baru dan menyimpannya sebagai httpOnly cookie.
 * Dipanggil setelah login berhasil (baik anggota maupun mitra).
 */
export async function buatSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DETIK}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DETIK,
  });
}

/**
 * Membaca & memverifikasi session dari cookie request saat ini.
 * Mengembalikan null kalau tidak ada session atau token tidak valid/kedaluwarsa.
 *
 * PENTING: payload ini hanya berisi identitas dasar (id, tipe, nama).
 * Untuk keputusan otorisasi (role/jabatan/divisi/is_superadmin), SELALU
 * query ulang ke database via authorize.ts — jangan percaya klaim role
 * dari JWT lama, karena penugasan periode bisa berubah kapan saja.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function hapusSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
