import { describe, it, expect } from 'vitest';
import { toPaise, fromPaise, formatINR, formatINRCompact } from '../utils/currency';

describe('Currency & Integer Paise Math (Rule 8.6)', () => {
  it('converts INR rupees to integer paise accurately', () => {
    expect(toPaise(100)).toBe(10000);
    expect(toPaise(99.99)).toBe(9999);
    expect(toPaise(0.05)).toBe(5);
    expect(toPaise(0)).toBe(0);
  });

  it('converts integer paise back to INR rupees without float errors', () => {
    expect(fromPaise(10000)).toBe(100);
    expect(fromPaise(9999)).toBe(99.99);
    expect(fromPaise(5)).toBe(0.05);
    expect(fromPaise(0)).toBe(0);
  });

  it('formats currency according to Indian numbering system', () => {
    const formatted = formatINR(13428);
    expect(formatted).toContain('13,428');
    expect(formatted).toContain('₹');
  });

  it('formats compact representation correctly for dashboard KPIs', () => {
    expect(formatINRCompact(500)).toBe('₹500');
    expect(formatINRCompact(1500)).toBe('₹1.5 K');
    expect(formatINRCompact(250000)).toBe('₹2.50 L');
    expect(formatINRCompact(10000000)).toBe('₹1.00 Cr');
  });

  it('handles negative balances gracefully', () => {
    const negative = formatINR(-500);
    expect(negative).toContain('-');
    expect(negative).toContain('500');
  });
});
