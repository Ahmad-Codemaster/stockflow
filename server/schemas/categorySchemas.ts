/**
 * ============================================================================
 * CATEGORY SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for category management endpoints.
 * Imported by `categoryController.ts` and `categoryRoutes.ts`.
 */

import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
  description: z.string().trim().max(500).optional(),
});

export const categoryUpdateSchema = categorySchema.partial();
