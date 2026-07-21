import { randomBytes } from "crypto";

/**
 * Menghasilkan token acak unik untuk kode_kartu (di-encode sebagai QR di ID Card).
 * Sengaja bukan berbasis NIM/nama, supaya tidak bisa ditebak/dipalsukan orang lain.
 */
export function generateKodeKartu(): string {
  return "HMTF-" + randomBytes(16).toString("hex");
}
