import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generate password sementara yang mudah dibacakan admin (dipakai untuk
 * fallback reset manual oleh admin, bukan alur self-service).
 */
export function generatePasswordSementara(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let hasil = "";
  for (let i = 0; i < 10; i++) {
    hasil += chars[Math.floor(Math.random() * chars.length)];
  }
  return hasil;
}
