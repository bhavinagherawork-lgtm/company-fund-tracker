import { describe, it, expect } from 'vitest';
import { hasPermission, assertPermission } from '../utils/permissions';

describe('Role-Based Access Control (RBAC) (Rule 5.2 & 5.3)', () => {
  describe('Admin permissions', () => {
    it('grants full administrative permissions', () => {
      expect(hasPermission('Admin', 'MANAGE_USERS')).toBe(true);
      expect(hasPermission('Admin', 'MANAGE_CATEGORIES')).toBe(true);
      expect(hasPermission('Admin', 'DELETE_EXPENSE')).toBe(true);
      expect(hasPermission('Admin', 'SYNC_GOOGLE_SHEETS')).toBe(true);
      expect(hasPermission('Admin', 'VIEW_AUDIT_LOGS')).toBe(true);
    });
  });

  describe('Manager permissions', () => {
    it('grants operational management without user administration', () => {
      expect(hasPermission('Manager', 'MANAGE_USERS')).toBe(false);
      expect(hasPermission('Manager', 'MANAGE_CATEGORIES')).toBe(true);
      expect(hasPermission('Manager', 'CREATE_EXPENSE')).toBe(true);
      expect(hasPermission('Manager', 'DELETE_EXPENSE')).toBe(true);
    });
  });

  describe('Accountant permissions', () => {
    it('grants ledger transaction recording but denies category and user modification', () => {
      expect(hasPermission('Accountant', 'CREATE_EXPENSE')).toBe(true);
      expect(hasPermission('Accountant', 'ADD_INCOME')).toBe(true);
      expect(hasPermission('Accountant', 'VIEW_REPORTS')).toBe(true);
      expect(hasPermission('Accountant', 'DELETE_EXPENSE')).toBe(false);
      expect(hasPermission('Accountant', 'MANAGE_USERS')).toBe(false);
      expect(hasPermission('Accountant', 'MANAGE_CATEGORIES')).toBe(false);
    });
  });

  describe('Viewer permissions', () => {
    it('restricts to read-only access', () => {
      expect(hasPermission('Viewer', 'VIEW_DASHBOARD')).toBe(true);
      expect(hasPermission('Viewer', 'VIEW_EXPENSES')).toBe(true);
      expect(hasPermission('Viewer', 'CREATE_EXPENSE')).toBe(false);
      expect(hasPermission('Viewer', 'ADD_INCOME')).toBe(false);
      expect(hasPermission('Viewer', 'MANAGE_USERS')).toBe(false);
    });
  });

  describe('assertPermission', () => {
    it('throws error when permission is denied', () => {
      expect(() => assertPermission('Viewer', 'MANAGE_USERS')).toThrowError(/Access Denied/);
    });

    it('does not throw when permission is granted', () => {
      expect(() => assertPermission('Admin', 'MANAGE_USERS')).not.toThrow();
    });
  });
});
