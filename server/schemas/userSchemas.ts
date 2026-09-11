/**
 * ============================================================================
 * USER SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for user management endpoints.
 * Imported by `userController.ts` and `userRoutes.ts`.
 */

import { z } from 'zod';
import { limitQuerySchema } from './common';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .email('Please enter a valid corporate email address')
    .trim()
    .toLowerCase(),
  role: z.enum(['ADMIN', 'STAFF']),
  status: z.enum(['Active', 'Inactive']).optional(),
  password: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().min(6, 'Password must be at least 6 characters').optional()
    ),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z
    .string()
    .email('Please enter a valid corporate email address')
    .trim()
    .toLowerCase()
    .optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  password: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().min(6, 'Password must be at least 6 characters').optional()
    ),
});

export const auditLogQuerySchema = limitQuerySchema;
