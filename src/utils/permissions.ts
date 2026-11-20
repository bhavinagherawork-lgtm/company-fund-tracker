/**
 * Role-Based Access Control (RBAC) conforming to AGENTS.md Section 5.2 & 5.3
 * - Deny by default
 * - Least privilege principle
 * - Centralized policy checks (no scattered inline checks)
 */

import type { UserRole } from '../types';

export type AppPermission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_EXPENSES'
  | 'CREATE_EXPENSE'
  | 'EDIT_EXPENSE'
  | 'DELETE_EXPENSE'
  | 'VIEW_INCOME'
  | 'ADD_INCOME'
  | 'VOID_INCOME'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  | 'MANAGE_CATEGORIES'
  | 'MANAGE_OFFICES'
  | 'MANAGE_USERS'
  | 'SYNC_GOOGLE_SHEETS'
  | 'VIEW_AUDIT_LOGS';

const ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  Admin: [
    'VIEW_DASHBOARD',
    'VIEW_EXPENSES',
    'CREATE_EXPENSE',
    'EDIT_EXPENSE',
    'DELETE_EXPENSE',
    'VIEW_INCOME',
    'ADD_INCOME',
    'VOID_INCOME',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_CATEGORIES',
    'MANAGE_OFFICES',
    'MANAGE_USERS',
    'SYNC_GOOGLE_SHEETS',
    'VIEW_AUDIT_LOGS',
  ],
  Manager: [
    'VIEW_DASHBOARD',
    'VIEW_EXPENSES',
    'CREATE_EXPENSE',
    'EDIT_EXPENSE',
    'DELETE_EXPENSE',
    'VIEW_INCOME',
    'ADD_INCOME',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_CATEGORIES',
    'SYNC_GOOGLE_SHEETS',
  ],
  Accountant: [
    'VIEW_DASHBOARD',
    'VIEW_EXPENSES',
    'CREATE_EXPENSE',
    'EDIT_EXPENSE',
    'VIEW_INCOME',
    'ADD_INCOME',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
  ],
  Viewer: [
    'VIEW_DASHBOARD',
    'VIEW_EXPENSES',
    'VIEW_INCOME',
    'VIEW_REPORTS',
  ],
};

/**
 * Checks whether a given user role possesses a specific permission.
 * Denies by default if role or permission is undefined.
 */
export function hasPermission(role?: UserRole | null, permission?: AppPermission): boolean {
  if (!role || !permission) return false;
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

/**
 * Asserts permission, throwing an Error if denied.
 */
export function assertPermission(role?: UserRole | null, permission?: AppPermission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Access Denied: Role "${role || 'Anonymous'}" lacks "${permission}" permission.`);
  }
}
