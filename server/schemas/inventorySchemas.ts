/**
 * ============================================================================
 * INVENTORY SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for inventory transaction endpoints.
 * Imported by `inventoryController.ts` and `inventoryRoutes.ts`.
 */

import { z } from 'zod';

export const stockInSchema = z.object({
  productId: z.string().trim().min(1, 'Product is required'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(1_000_000, 'Quantity exceeds maximum allowed'),
  supplierId: z.string().trim().nullable().optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const stockOutSchema = z.object({
  productId: z.string().trim().min(1, 'Product is required'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(1_000_000, 'Quantity exceeds maximum allowed'),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const stockAdjustSchema = z
  .object({
    productId: z.string().trim().min(1, 'Product is required'),
    targetQuantity: z
      .number()
      .int('Target quantity must be a whole number')
      .min(0, 'Target quantity cannot be negative')
      .optional(),
    quantity: z.number().int().optional(),
    reference: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => data.targetQuantity !== undefined || data.quantity !== undefined,
    { message: 'Either targetQuantity or quantity delta must be provided' }
  );

export const inventoryQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().trim().optional(),
  status: z
    .enum(['All', 'all', 'In Stock', 'Low Stock', 'Out of Stock'])
    .optional(),
});

export const transactionQuerySchema = z.object({
  type: z
    .enum([
      'all', 'ALL',
      'stock_in', 'STOCK_IN',
      'stock_out', 'STOCK_OUT',
      'adjustment', 'ADJUSTMENT',
      'Stock In', 'Stock Out', 'Adjustment',
    ])
    .optional(),
  productId: z.string().trim().optional(),
  limit: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 100),
      z.number().int().positive().max(500, 'Limit cannot exceed 500')
    )
    .optional(),
});
