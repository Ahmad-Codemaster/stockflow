/**
 * ============================================================================
 * REPORT SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for report query endpoints.
 * Imported by `reportRoutes.ts`.
 */

import { z } from 'zod';

export const reportQuerySchema = z.object({
  days: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 30),
      z
        .number()
        .int()
        .positive()
        .refine((v) => [7, 30, 90, 365].includes(v), {
          message: 'days must be one of: 7, 30, 90, 365',
        })
    )
    .optional(),
  categoryId: z.string().trim().optional(),
  limit: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 100),
      z.number().int().positive().max(500, 'Limit cannot exceed 500')
    )
    .optional(),
});
