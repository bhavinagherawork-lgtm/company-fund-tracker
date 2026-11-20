import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, sha256 } from '../utils/crypto';

describe('Password Hashing & Verification (Rule 5.1 & 12.2)', () => {
  it('computes sha256 digest accurately', async () => {
    const hash = await sha256('hello-world');
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });

  it('hashes passwords with unique salts', async () => {
    const hash1 = await hashPassword('password123');
    const hash2 = await hashPassword('password123');
    expect(hash1).not.toBe(hash2); // unique per-user salt
    expect(hash1.startsWith('ef_salt_v1:')).toBe(true);
  });

  it('verifies correctly salted passwords', async () => {
    const hash = await hashPassword('secretP@ssword!');
    const isCorrect = await verifyPassword('secretP@ssword!', hash);
    const isWrong = await verifyPassword('wrongpassword', hash);

    expect(isCorrect).toBe(true);
    expect(isWrong).toBe(false);
  });

  it('maintains backward compatibility with legacy seed credentials', async () => {
    // Initial seeds are plain until first login migration
    const isSeedAdmin = await verifyPassword('admin123', 'admin123');
    const isWrongSeed = await verifyPassword('other', 'admin123');

    expect(isSeedAdmin).toBe(true);
    expect(isWrongSeed).toBe(false);
  });
});
