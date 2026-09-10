import { z } from 'zod';

/**
 * Common reusable validation schema for entity route parameters (:id).
 * Guarantees that :id is non-empty and stripped of leading/trailing whitespace.
 */
export const idParamSchema = z.object({
  id: z.string().trim().min(1, 'Identifier is required'),
});

/**
 * Common reusable validation schema for pagination limit query parameters.
 * Coerces string numbers to integers, defaulting to 100 and capping at 500.
 */
export const limitQuerySchema = z.object({
  limit: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 100),
      z.number().int().positive('Limit must be a positive integer').max(500, 'Limit cannot exceed 500')
    )
    .optional(),
});
