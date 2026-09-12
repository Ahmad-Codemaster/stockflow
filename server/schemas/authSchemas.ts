/**
 * ============================================================================
 * AUTHENTICATION SCHEMAS
 * ============================================================================
 * Centralized Zod validation schemas for authentication endpoints.
 * Imported by `authController.ts` and `authRoutes.ts`.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Valid email is required')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});
