/**
 * StockFlow — Global Domain Constants
 */

export const DEFAULT_PAGE_SIZE = 10;

export const STOCK_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
} as const;

export type StockStatusType = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS];

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export const USER_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export const TRANSACTION_TYPES = {
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;
