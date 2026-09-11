/**
 * ============================================================================
 * SUPPLIER SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for supplier management endpoints.
 * Imported by `supplierController.ts` and `supplierRoutes.ts`.
 */

import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required').max(200),
  contactPerson: z.string().trim().max(100).optional(),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  leadTime: z
    .number()
    .int()
    .nonnegative('Lead time cannot be negative')
    .max(365, 'Lead time cannot exceed 365 days')
    .optional(),
});

export const supplierUpdateSchema = supplierSchema.partial();
