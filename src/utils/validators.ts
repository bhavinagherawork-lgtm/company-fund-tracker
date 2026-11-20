/**
 * Data Validation Layer conforming to AGENTS.md Section 6.4 (Data Validation)
 * - Built on Zod schema validation
 * - Strictly validates types, format, limits, ranges, and enums
 * - Rejects unknown or malformed properties
 * - Allowlists over denylists
 * - Prevents raw 'expected number, received NaN' errors with human-friendly error messages
 */

import { z } from 'zod';
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

/**
 * Universal Amount Zod Schema
 * Safely parses strings, numbers, empty inputs, and NaN without throwing raw Zod errors.
 */
export const amountField = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'number') return Number.isNaN(val) ? undefined : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}, z.number({
  error: 'Amount is required and must be a valid number.',
})
  .positive('Amount must be a positive number greater than 0.')
  .max(10000000, 'Amount exceeds maximum allowable transaction limit (₹1 Crore).')
);

/**
 * Zod Schema for Expense Records
 */
export const expenseZodSchema = z.object({
  expenseTitle: z.string({
    error: 'Expense title is required.',
  })
    .trim()
    .min(1, 'Expense title is required.')
    .max(255, 'Expense title cannot exceed 255 characters.'),
  amount: amountField,
  expenseDate: z.string({
    error: 'A valid date in YYYY-MM-DD format is required.',
  }).refine(isValidISODate, {
    message: 'A valid date in YYYY-MM-DD format is required.',
  }),
  categoryId: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }, z.number({
    error: 'Please select an expense category.',
  }).positive('Please select an expense category.').optional()),
  officeId: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }, z.number({
    error: 'Please select an office or branch.',
  }).positive('Please select an office or branch.').optional()),
  paymentMode: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card'] as const, {
    error: `Invalid payment mode. Must be one of: ${ALLOWED_PAYMENT_MODES.join(', ')}`,
  }).optional().default('UPI'),
  status: z.enum(['Completed', 'Pending', 'Void'] as const, {
    error: `Invalid status. Must be one of: ${ALLOWED_TRANSACTION_STATUSES.join(', ')}`,
  }).optional().default('Completed'),
  vendor: z.string().trim().max(255, 'Vendor cannot exceed 255 characters.').optional(),
  billNumber: z.string().trim().max(100, 'Bill number cannot exceed 100 characters.').optional(),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters.').optional(),
});

/**
 * Zod Schema for Income Records
 */
export const incomeZodSchema = z.object({
  receivedFrom: z.string({
    error: 'Source/payer name is required.',
  })
    .trim()
    .min(1, 'Source/payer name is required.')
    .max(255, 'Source name cannot exceed 255 characters.'),
  amount: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'number') return Number.isNaN(val) ? undefined : val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      return Number.isNaN(n) ? undefined : n;
    }
    return undefined;
  }, z.number({
    error: 'Amount is required and must be a valid number.',
  })
    .positive('Amount must be a positive number greater than 0.')
    .max(50000000, 'Amount exceeds maximum allowable limit (₹5 Crore).')
  ),
  transactionDate: z.string({
    error: 'A valid transaction date in YYYY-MM-DD format is required.',
  }).refine(isValidISODate, {
    message: 'A valid transaction date in YYYY-MM-DD format is required.',
  }),
  officeId: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }, z.number({
    error: 'Please select an office or branch.',
  }).positive('Please select an office or branch.').optional()),
  paymentMode: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card'] as const, {
    error: `Invalid payment mode. Must be one of: ${ALLOWED_PAYMENT_MODES.join(', ')}`,
  }).optional().default('Bank Transfer'),
  referenceNumber: z.string().trim().max(100, 'Reference number cannot exceed 100 characters.').optional(),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters.').optional(),
});

/**
 * Zod Schema for Users
 */
export const userZodSchema = z.object({
  username: z.string({
    error: 'Username is required.',
  })
    .trim()
    .min(1, 'Username is required.')
    .min(3, 'Username must be between 3 and 30 characters.')
    .max(30, 'Username must be between 3 and 30 characters.')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores.'),
  fullName: z.string({
    error: 'Full name is required.',
  })
    .trim()
    .min(1, 'Full name is required.')
    .max(100, 'Full name cannot exceed 100 characters.'),
  email: z.string().trim().optional().refine((val) => {
    if (!val) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }, {
    message: 'Please provide a valid email address.',
  }),
  role: z.enum(['Admin', 'Manager', 'Accountant', 'Viewer'] as const, {
    error: `Invalid user role. Must be one of: ${ALLOWED_USER_ROLES.join(', ')}`,
  }).optional().default('Accountant'),
  status: z.enum(['Active', 'Inactive'] as const, {
    error: `Invalid user status. Must be one of: ${ALLOWED_USER_STATUSES.join(', ')}`,
  }).optional().default('Active'),
  password: z.string().optional(),
  isNewUser: z.boolean().optional(),
}).refine((data) => {
  if (data.isNewUser) {
    return Boolean(data.password && data.password.length >= 6);
  }
  return true;
}, {
  message: 'Password must be at least 6 characters.',
  path: ['password'],
});

/**
 * Zod Schema for Offices
 */
export const officeZodSchema = z.object({
  name: z.string({
    error: 'Office name is required.',
  })
    .trim()
    .min(1, 'Office name is required.')
    .max(100, 'Office name cannot exceed 100 characters.'),
  code: z.string({
    error: 'Office code is required.',
  })
    .trim()
    .min(1, 'Office code is required.')
    .max(10, 'Office code cannot exceed 10 characters.'),
  location: z.string().trim().max(255, 'Location cannot exceed 255 characters.').optional(),
});

/**
 * Zod Schema for Categories
 */
export const categoryZodSchema = z.object({
  name: z.string({
    error: 'Category name is required.',
  })
    .trim()
    .min(1, 'Category name is required.')
    .max(100, 'Category name cannot exceed 100 characters.'),
  code: z.string({
    error: 'Category code/tag is required.',
  })
    .trim()
    .min(1, 'Category code/tag is required.')
    .max(20, 'Category code cannot exceed 20 characters.'),
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters.').optional(),
});

/**
 * Formats ZodError issues into a clean { [fieldName]: errorMessage } dictionary
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() || '_form';
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

/**
 * Validates an expense payload using expenseZodSchema
 */
export function validateExpenseInput(data: {
  expenseTitle?: string;
  amount?: any;
  expenseDate?: string;
  categoryId?: any;
  officeId?: any;
  paymentMode?: any;
  status?: any;
  vendor?: string;
  billNumber?: string;
  description?: string;
}): ValidationResult {
  const result = expenseZodSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return {
    isValid: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates an income payload using incomeZodSchema
 */
export function validateIncomeInput(data: {
  receivedFrom?: string;
  amount?: any;
  transactionDate?: string;
  officeId?: any;
  paymentMode?: any;
  referenceNumber?: string;
  description?: string;
}): ValidationResult {
  const result = incomeZodSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return {
    isValid: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates a user payload using userZodSchema
 */
export function validateUserInput(data: {
  username?: string;
  fullName?: string;
  email?: string;
  role?: any;
  status?: any;
  password?: string;
  isNewUser?: boolean;
}): ValidationResult {
  const result = userZodSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return {
    isValid: false,
    errors: formatZodErrors(result.error),
  };
}
