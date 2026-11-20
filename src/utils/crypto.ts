/**
 * Cryptographic Password Hashing conforming to AGENTS.md Section 5.1 & 12.2
 * Uses standard WebCrypto API (SHA-256 with per-user salt and hex encoding)
 * Supports backward-compatible verification for default seed accounts.
 */

const SALT_PREFIX = 'ef_salt_v1:';

/**
 * Computes a SHA-256 digest of a string using WebCrypto
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random cryptographic salt
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hashes a plaintext password with a unique cryptographic salt
 * Format: `ef_salt_v1:<salt>:<hash>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const hash = await sha256(`${salt}:${password}`);
  return `${SALT_PREFIX}${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored password hash or legacy seed
 */
export async function verifyPassword(password: string, storedHashOrPlain: string): Promise<boolean> {
  if (!password || !storedHashOrPlain) return false;

  // 1. If stored using modern salt format
  if (storedHashOrPlain.startsWith(SALT_PREFIX)) {
    const parts = storedHashOrPlain.slice(SALT_PREFIX.length).split(':');
    if (parts.length !== 2) return false;
    const [salt, expectedHash] = parts;
    const actualHash = await sha256(`${salt}:${password}`);
    return actualHash === expectedHash;
  }

  // 2. Legacy seed fallback (e.g. initial seed credentials 'admin123')
  return password === storedHashOrPlain;
}
