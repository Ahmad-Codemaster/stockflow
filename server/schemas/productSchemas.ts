/**
 * ============================================================================
 * PRODUCT SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for product catalog endpoints.
 * Imported by `productController.ts` and `productRoutes.ts`.
 */

import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().min(1, 'SKU is required').toUpperCase(),
  categoryId: z.string().trim().min(1, 'Category is required'),
  supplierId: z.string().trim().nullable().optional(),
  price: z
    .number()
    .nonnegative('Price cannot be negative')
    .max(10_000_000, 'Price exceeds maximum allowed value'),
  initialStock: z.number().int().nonnegative().optional(),
  reorderLevel: z
    .number()
    .int()
    .nonnegative('Reorder level cannot be negative'),
  description: z.string().trim().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  supplierId: z.string().trim().nullable().optional(),
  price: z
    .number()
    .nonnegative()
    .max(10_000_000, 'Price exceeds maximum allowed value')
    .optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  description: z.string().trim().optional(),
});

export const productQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().trim().optional(),
  status: z
    .enum(['All', 'all', 'In Stock', 'Low Stock', 'Out of Stock'])
    .optional(),
  includeArchived: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
});
