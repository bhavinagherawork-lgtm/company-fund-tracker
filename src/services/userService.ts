import { db } from '../database/db';
import type { User } from '../types';
import { initialUsers } from '../database/seedData';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { validateUserInput } from '../utils/validators';
import { logAuditEvent } from './auditService';

// Rule 5.8: Brute Force Protection (Per-Account Rate Limiter with 60s cooldown)
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000; // 60s cooldown

/**
 * Ensures at least one mandatory user entry exists in the User table.
 */
export async function ensureMandatoryUser(): Promise<void> {
  const count = await db.users.count();
  if (count === 0) {
    console.log('Mandatory user requirement: Seeding default administrator...');
    await db.users.bulkAdd(initialUsers as User[]);
  }
}

/**
 * Retrieves all users from the User table
 */
export async function getUsers(): Promise<User[]> {
  await ensureMandatoryUser();
  return await db.users.toArray();
}

/**
 * Retrieves a user by their unique database ID
 */
export async function getUserById(id: number): Promise<User | undefined> {
  return await db.users.get(id);
}

/**
 * Retrieves a user by username (case-insensitive)
 */
export async function getUserByUsername(username: string): Promise<User | undefined> {
  const all = await db.users.toArray();
  return all.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

/**
 * Creates a new user in the User table with validation and password hashing
 */
export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<number> {
  const validation = validateUserInput({
    username: userData.username,
    fullName: userData.fullName,
    email: userData.email,
    role: userData.role,
    status: userData.status,
    password: userData.passwordHash,
    isNewUser: true,
  });

  if (!validation.isValid) {
    const msg = Object.values(validation.errors)[0] || 'Invalid user data provided.';
    throw new Error(msg);
  }

  const trimmedUsername = userData.username.trim().toLowerCase();

  // Check username uniqueness
  const existing = await getUserByUsername(trimmedUsername);
  if (existing) {
    throw new Error(`Username "${userData.username}" is already taken.`);
  }

  if (userData.email) {
    const all = await db.users.toArray();
    const emailExists = all.some((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (emailExists) {
      throw new Error(`Email "${userData.email}" is already registered.`);
    }
  }

  // Hash password securely (Rule 5.1)
  const secureHash = await hashPassword(userData.passwordHash);

  const newUser: User = {
    ...userData,
    username: trimmedUsername,
    fullName: userData.fullName.trim(),
    email: userData.email.trim(),
    passwordHash: secureHash,
    role: userData.role || 'Viewer',
    status: userData.status || 'Active',
    createdAt: new Date().toISOString(),
  };

  const id = await db.users.add(newUser);
  await logAuditEvent({
    action: 'CREATE_USER',
    resource: 'users',
    username: newUser.username,
    details: `Role: ${newUser.role}, Status: ${newUser.status}`,
    status: 'SUCCESS',
  });

  return Number(id);
}

/**
 * Updates an existing user's information
 */
export async function updateUser(id: number, updates: Partial<User>): Promise<void> {
  const user = await db.users.get(id);
  if (!user) {
    throw new Error('User not found.');
  }

  // Validate updates
  const validation = validateUserInput({
    username: updates.username || user.username,
    fullName: updates.fullName || user.fullName,
    email: updates.email !== undefined ? updates.email : user.email,
    role: updates.role || user.role,
    status: updates.status || user.status,
    password: updates.passwordHash,
    isNewUser: false,
  });

  if (!validation.isValid) {
    const msg = Object.values(validation.errors)[0] || 'Invalid update parameters.';
    throw new Error(msg);
  }

  // If changing username, check uniqueness
  if (updates.username && updates.username.trim().toLowerCase() !== user.username.toLowerCase()) {
    const existing = await getUserByUsername(updates.username);
    if (existing && existing.id !== id) {
      throw new Error(`Username "${updates.username}" is already taken.`);
    }
    updates.username = updates.username.trim().toLowerCase();
  }

  // Safeguard: Cannot deactivate the ONLY active user
  if (updates.status === 'Inactive' && user.status === 'Active') {
    const allActive = await db.users.filter((u) => u.status === 'Active').toArray();
    if (allActive.length <= 1) {
      throw new Error('Cannot deactivate: At least one active user must remain in the system.');
    }
  }

  // Safeguard: Cannot demote the ONLY Admin
  if (updates.role && updates.role !== 'Admin' && user.role === 'Admin') {
    const allAdmins = await db.users.filter((u) => u.role === 'Admin' && u.status === 'Active').toArray();
    if (allAdmins.length <= 1) {
      throw new Error('Cannot change role: System requires at least one active Administrator.');
    }
  }

  // If updating password, hash it securely
  const preparedUpdates = { ...updates };
  if (updates.passwordHash && updates.passwordHash.trim()) {
    preparedUpdates.passwordHash = await hashPassword(updates.passwordHash);
  }

  await db.users.update(id, {
    ...preparedUpdates,
    updatedAt: new Date().toISOString(),
  });

  await logAuditEvent({
    action: 'UPDATE_USER',
    resource: 'users',
    username: user.username,
    details: `Updated fields: ${Object.keys(updates).join(', ')}`,
    status: 'SUCCESS',
  });
}

/**
 * Deletes a user from the User table.
 * MANDATORY SAFEGUARD: Rejects deletion if only 1 user exists in the User table!
 */
export async function deleteUser(id: number, currentUserId?: number): Promise<{ success: boolean; message?: string }> {
  // 1. Mandatory rule: At least one user entry mandatory in User table
  const totalCount = await db.users.count();
  if (totalCount <= 1) {
    throw new Error('Deletion blocked: At least one User entry is mandatory in the User table.');
  }

  // 2. Prevent self-deletion
  if (currentUserId && id === currentUserId) {
    throw new Error('You cannot delete your own active session account.');
  }

  // 3. Prevent deleting the only active Admin
  const targetUser = await db.users.get(id);
  if (targetUser?.role === 'Admin') {
    const adminCount = await db.users.filter((u) => u.role === 'Admin' && u.status === 'Active').count();
    if (adminCount <= 1) {
      throw new Error('Deletion blocked: You cannot delete the only active Administrator.');
    }
  }

  await db.users.delete(id);
  if (targetUser) {
    await logAuditEvent({
      action: 'DELETE_USER',
      resource: 'users',
      username: targetUser.username,
      details: `Deleted user ID ${id}`,
      status: 'SUCCESS',
    });
  }
  return { success: true, message: 'User deleted successfully.' };
}

/**
 * Authenticates a user with username/email and password
 * Conforms to Rule 5.1 (Crypto hash verification) & Rule 5.8 (Brute force protection)
 */
export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  await ensureMandatoryUser();
  const trimmed = usernameOrEmail.trim().toLowerCase();

  // Check rate limit lockout (Rule 5.8)
  const attempt = loginAttempts.get(trimmed);
  const nowMs = Date.now();
  if (attempt && attempt.lockedUntil > nowMs) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil - nowMs) / 1000);
    await logAuditEvent({
      action: 'LOGIN_LOCKED',
      resource: 'auth',
      username: trimmed,
      details: `Rate limit lockout active (${remainingSeconds}s remaining)`,
      status: 'FAILURE',
    });
    return {
      success: false,
      error: `Too many failed login attempts. Please wait ${remainingSeconds} seconds before trying again.`,
    };
  }

  const all = await db.users.toArray();
  const user = all.find(
    (u) => u.username.toLowerCase() === trimmed || (u.email && u.email.toLowerCase() === trimmed)
  );

  // Generic message on unknown user (Rule 5.1: prevent account enumeration)
  if (!user) {
    trackFailedLogin(trimmed);
    await logAuditEvent({
      action: 'LOGIN_FAILED',
      resource: 'auth',
      username: trimmed,
      details: 'User not found',
      status: 'FAILURE',
    });
    return { success: false, error: 'Invalid username or password.' };
  }

  if (user.status === 'Inactive') {
    return { success: false, error: 'Account is deactivated. Please contact an administrator.' };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    trackFailedLogin(trimmed);
    await logAuditEvent({
      action: 'LOGIN_FAILED',
      resource: 'auth',
      username: user.username,
      details: 'Invalid password credentials',
      status: 'FAILURE',
    });
    return { success: false, error: 'Invalid username or password.' };
  }

  // Clear failed attempt tracking on successful login
  loginAttempts.delete(trimmed);

  // If password was legacy unhashed, silently upgrade to salted hash (Rule 5.1)
  if (!user.passwordHash.startsWith('ef_salt_v1:')) {
    const upgradedHash = await hashPassword(password);
    await db.users.update(user.id!, { passwordHash: upgradedHash });
    user.passwordHash = upgradedHash;
  }

  // Update last login timestamp
  const now = new Date().toISOString();
  await db.users.update(user.id!, { lastLoginAt: now });
  user.lastLoginAt = now;

  await logAuditEvent({
    action: 'LOGIN_SUCCESS',
    resource: 'auth',
    username: user.username,
    userId: user.id,
    details: `Role: ${user.role}`,
    status: 'SUCCESS',
  });

  return { success: true, user };
}

function trackFailedLogin(username: string): void {
  const current = loginAttempts.get(username) || { count: 0, lockedUntil: 0 };
  current.count += 1;
  if (current.count >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    current.count = 0; // reset counter after triggering lockout
  }
  loginAttempts.set(username, current);
}

