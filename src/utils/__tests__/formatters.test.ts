import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatNumber, getStockBadgeVariant } from '../formatters';

describe('formatters', () => {
  it('formatCurrency formats standard dollar values', () => {
    expect(formatCurrency(49.99)).toBe('$49.99');
    expect(formatCurrency(1200)).toBe('$1,200.00');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(NaN)).toBe('$0.00');
  });

  it('formatDate formats ISO dates to YYYY-MM-DD', () => {
    expect(formatDate('2026-05-15T10:30:00Z')).toBe('2026-05-15');
    expect(formatDate(new Date('2026-08-20T00:00:00Z'))).toBe('2026-08-20');
    expect(formatDate('')).toBe('—');
  });

  it('formatNumber formats counts with thousand separators', () => {
    expect(formatNumber(12500)).toBe('12,500');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(NaN)).toBe('0');
  });

  it('getStockBadgeVariant correctly assigns variant types', () => {
    expect(getStockBadgeVariant('In Stock')).toBe('success');
    expect(getStockBadgeVariant('Low Stock')).toBe('warning');
    expect(getStockBadgeVariant('Out of Stock')).toBe('danger');
    expect(getStockBadgeVariant('Unknown')).toBe('neutral');
  });
});
