import bcrypt from "bcryptjs";

// Cost 12: ~200-300ms per hash — slow enough to blunt offline brute-forcing, fast enough for interactive login.
const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
