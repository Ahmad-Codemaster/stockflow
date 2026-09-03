/**
 * StockFlow — Pure Data Formatting Utilities
 */

import { STOCK_STATUS, StockStatusType } from './constants';

/**
 * Formats a numeric price to standard currency string ($XX.XX).
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an ISO date string or Date object into human-readable YYYY-MM-DD.
 */
export function formatDate(date: string | Date): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return d.toISOString().split('T')[0];
  } catch {
    return String(date);
  }
}

/**
 * Formats an integer or decimal count with thousands separators.
 */
export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Maps product stock status to UI badge color variant.
 */
export function getStockBadgeVariant(
  status: StockStatusType | string
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case STOCK_STATUS.IN_STOCK:
      return 'success';
    case STOCK_STATUS.LOW_STOCK:
      return 'warning';
    case STOCK_STATUS.OUT_OF_STOCK:
      return 'danger';
    default:
      return 'neutral';
  }
}
