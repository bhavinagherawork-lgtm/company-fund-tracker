import { describe, it, expect } from 'vitest';
import {
  validateExpenseInput,
  validateIncomeInput,
  validateUserInput,
  isValidISODate,
} from '../utils/validators';

describe('Data Validation Layer (Rule 6.4)', () => {
  describe('isValidISODate', () => {
    it('accepts valid YYYY-MM-DD dates', () => {
      expect(isValidISODate('2026-11-20')).toBe(true);
      expect(isValidISODate('2026-02-28')).toBe(true);
    });

    it('rejects invalid date formats and impossible dates', () => {
      expect(isValidISODate('2026/11/20')).toBe(false);
      expect(isValidISODate('20-11-2026')).toBe(false);
      expect(isValidISODate('invalid')).toBe(false);
      expect(isValidISODate('2026-02-31')).toBe(false);
    });
  });

  describe('validateExpenseInput', () => {
    it('passes for valid expense input', () => {
      const res = validateExpenseInput({
        expenseTitle: 'Stationery Items',
        amount: 450,
        expenseDate: '2026-11-20',
        paymentMode: 'Cash',
        status: 'Completed',
      });
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);
    });

    it('rejects empty title, negative amounts, or invalid date', () => {
      const res = validateExpenseInput({
        expenseTitle: '',
        amount: -50,
        expenseDate: 'bad-date',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.expenseTitle).toBeDefined();
      expect(res.errors.amount).toBeDefined();
      expect(res.errors.expenseDate).toBeDefined();
    });

    it('rejects unknown payment mode enum', () => {
      const res = validateExpenseInput({
        expenseTitle: 'Snacks',
        amount: 100,
        expenseDate: '2026-11-20',
        paymentMode: 'Bitcoin' as any,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.paymentMode).toBeDefined();
    });
  });

  describe('validateIncomeInput', () => {
    it('passes for valid income input', () => {
      const res = validateIncomeInput({
        receivedFrom: 'Director Cash Fund',
        amount: 25000,
        transactionDate: '2026-11-20',
        paymentMode: 'Bank Transfer',
      });
      expect(res.isValid).toBe(true);
    });

    it('rejects missing source or negative amounts', () => {
      const res = validateIncomeInput({
        receivedFrom: '',
        amount: 0,
        transactionDate: '2026-11-20',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.receivedFrom).toBeDefined();
      expect(res.errors.amount).toBeDefined();
    });
  });

  describe('validateUserInput', () => {
    it('passes for valid user profile data', () => {
      const res = validateUserInput({
        username: 'john_doe',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'Accountant',
        status: 'Active',
        password: 'securepassword123',
        isNewUser: true,
      });
      expect(res.isValid).toBe(true);
    });

    it('rejects short passwords and invalid characters in username', () => {
      const res = validateUserInput({
        username: 'john with spaces',
        fullName: 'John',
        password: '123',
        isNewUser: true,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.username).toBeDefined();
      expect(res.errors.password).toBeDefined();
    });
  });
});
