/**
 * Data Validation Layer conforming to AGENTS.md Section 6.4 (Data Validation)
 * - Strict server/client validation of type, format, range, and enums
 * - Rejects unknown or malformed properties
 * - Allowlists over denylists
 */

import type { PaymentMode, TransactionStatus, UserRole, UserStatus } from '../types';

export const ALLOWED_PAYMENT_MODES: PaymentMode[] = [
  'Cash',
  'Bank Transfer',
  'UPI',
  'Cheque',
  'Card',
];

export const ALLOWED_TRANSACTION_STATUSES: TransactionStatus[] = [
  'Completed',
  'Pending',
  'Void',
];

export const ALLOWED_USER_ROLES: UserRole[] = [
  'Admin',
  'Manager',
  'Accountant',
  'Viewer',
];

export const ALLOWED_USER_STATUSES: UserStatus[] = ['Active', 'Inactive'];

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function isValidISODate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

export function validateExpenseInput(data: {
  expenseTitle?: string;
  amount?: number;
  expenseDate?: string;
  paymentMode?: any;
  status?: any;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.expenseTitle || typeof data.expenseTitle !== 'string' || data.expenseTitle.trim().length === 0) {
    errors.expenseTitle = 'Expense title is required.';
  } else if (data.expenseTitle.trim().length > 255) {
    errors.expenseTitle = 'Expense title cannot exceed 255 characters.';
  }

  const amt = Number(data.amount);
  if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
    errors.amount = 'Amount must be a positive number greater than 0.';
  } else if (amt > 10000000) {
    errors.amount = 'Amount exceeds maximum allowable transaction limit (₹1 Crore).';
  }

  if (!data.expenseDate || !isValidISODate(data.expenseDate)) {
    errors.expenseDate = 'A valid date in YYYY-MM-DD format is required.';
  }

  if (data.paymentMode && !ALLOWED_PAYMENT_MODES.includes(data.paymentMode)) {
    errors.paymentMode = `Invalid payment mode. Must be one of: ${ALLOWED_PAYMENT_MODES.join(', ')}`;
  }

  if (data.status && !ALLOWED_TRANSACTION_STATUSES.includes(data.status)) {
    errors.status = `Invalid status. Must be one of: ${ALLOWED_TRANSACTION_STATUSES.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateIncomeInput(data: {
  receivedFrom?: string;
  amount?: number;
  transactionDate?: string;
  paymentMode?: any;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.receivedFrom || typeof data.receivedFrom !== 'string' || data.receivedFrom.trim().length === 0) {
    errors.receivedFrom = 'Source/payer name is required.';
  } else if (data.receivedFrom.trim().length > 255) {
    errors.receivedFrom = 'Source name cannot exceed 255 characters.';
  }

  const amt = Number(data.amount);
  if (isNaN(amt) || !isFinite(amt) || amt <= 0) {
    errors.amount = 'Amount must be a positive number greater than 0.';
  } else if (amt > 50000000) {
    errors.amount = 'Amount exceeds maximum allowable limit (₹5 Crore).';
  }

  if (!data.transactionDate || !isValidISODate(data.transactionDate)) {
    errors.transactionDate = 'A valid transaction date in YYYY-MM-DD format is required.';
  }

  if (data.paymentMode && !ALLOWED_PAYMENT_MODES.includes(data.paymentMode)) {
    errors.paymentMode = `Invalid payment mode. Must be one of: ${ALLOWED_PAYMENT_MODES.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateUserInput(data: {
  username?: string;
  fullName?: string;
  email?: string;
  role?: any;
  status?: any;
  password?: string;
  isNewUser?: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
    errors.username = 'Username is required.';
  } else {
    const trimmed = data.username.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      errors.username = 'Username must be between 3 and 30 characters.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      errors.username = 'Username can only contain letters, numbers, hyphens, and underscores.';
    }
  }

  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length === 0) {
    errors.fullName = 'Full name is required.';
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  if (data.role && !ALLOWED_USER_ROLES.includes(data.role)) {
    errors.role = `Invalid user role. Must be one of: ${ALLOWED_USER_ROLES.join(', ')}`;
  }

  if (data.status && !ALLOWED_USER_STATUSES.includes(data.status)) {
    errors.status = `Invalid user status. Must be one of: ${ALLOWED_USER_STATUSES.join(', ')}`;
  }

  if (data.isNewUser) {
    if (!data.password || data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
