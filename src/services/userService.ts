import { db } from '../database/db';
import type { User } from '../types';
import { initialUsers } from '../database/seedData';

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
 * Creates a new user in the User table
 */
export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<number> {
  const trimmedUsername = userData.username.trim().toLowerCase();
  if (!trimmedUsername) {
    throw new Error('Username is required.');
  }

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

  const newUser: User = {
    ...userData,
    username: trimmedUsername,
    fullName: userData.fullName.trim(),
    email: userData.email.trim(),
    passwordHash: userData.passwordHash,
    role: userData.role || 'Viewer',
    status: userData.status || 'Active',
    createdAt: new Date().toISOString(),
  };

  const id = await db.users.add(newUser);
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

  await db.users.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
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
  return { success: true, message: 'User deleted successfully.' };
}

/**
 * Authenticates a user with username/email and password
 */
export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  await ensureMandatoryUser();
  const trimmed = usernameOrEmail.trim().toLowerCase();

  const all = await db.users.toArray();
  const user = all.find(
    (u) => u.username.toLowerCase() === trimmed || (u.email && u.email.toLowerCase() === trimmed)
  );

  if (!user) {
    return { success: false, error: 'Invalid username or password.' };
  }

  if (user.status === 'Inactive') {
    return { success: false, error: 'Account is deactivated. Please contact an administrator.' };
  }

  if (user.passwordHash !== password) {
    return { success: false, error: 'Invalid username or password.' };
  }

  // Update last login timestamp
  const now = new Date().toISOString();
  await db.users.update(user.id!, { lastLoginAt: now });
  user.lastLoginAt = now;

  return { success: true, user };
}
