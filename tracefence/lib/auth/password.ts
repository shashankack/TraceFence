import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

/** Format: scrypt$N$r$p$saltHex$hashHex */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  const actual = scryptSync(password, salt, expected.length, { N, r, p });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
