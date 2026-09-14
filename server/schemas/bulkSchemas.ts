/**
 * ============================================================================
 * BULK CSV IMPORT SCHEMAS (`server/schemas/bulkSchemas.ts`)
 * ============================================================================
 * What this module does:
 * - Centralized Zod validation schemas for bulk CSV import endpoints:
 *   1. `POST /api/products/bulk`
 *   2. `POST /api/inventory/bulk-stock-in`
 *   3. `POST /api/inventory/bulk-stock-out`
 * - Limits batches to a maximum of 500 items to protect memory and database stability.
 */

import { z } from 'zod';

export const bulkProductItemSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().min(1, 'SKU is required').toUpperCase(),
  categoryName: z.string().trim().min(1, 'Category name is required'),
  supplierName: z.string().trim().optional(),
  price: z
    .number()
    .nonnegative('Price cannot be negative')
    .max(10_000_000, 'Price exceeds maximum allowed value'),
  initialStock: z.number().int().nonnegative().optional().default(0),
  reorderLevel: z
    .number()
    .int()
    .nonnegative('Reorder level cannot be negative')
    .optional()
    .default(10),
  description: z.string().trim().optional(),
});

export const bulkProductsSchema = z.object({
  items: z
    .array(bulkProductItemSchema)
    .min(1, 'At least one product is required')
    .max(500, 'Batch size cannot exceed 500 items'),
});

export const bulkStockInItemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').toUpperCase(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0')
    .max(1_000_000, 'Quantity exceeds maximum allowed'),
  supplierName: z.string().trim().optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const bulkStockInSchema = z.object({
  items: z
    .array(bulkStockInItemSchema)
    .min(1, 'At least one item is required')
    .max(500, 'Batch size cannot exceed 500 items'),
});

export const bulkStockOutItemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').toUpperCase(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0')
    .max(1_000_000, 'Quantity exceeds maximum allowed'),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const bulkStockOutSchema = z.object({
  items: z
    .array(bulkStockOutItemSchema)
    .min(1, 'At least one item is required')
    .max(500, 'Batch size cannot exceed 500 items'),
});

export type BulkProductItem = z.infer<typeof bulkProductItemSchema>;
export type BulkStockInItem = z.infer<typeof bulkStockInItemSchema>;
export type BulkStockOutItem = z.infer<typeof bulkStockOutItemSchema>;
