/**
 * ============================================================================
 * CENTRALIZED ERROR HANDLER & DOMAIN EXCEPTION (`AppError`)
 * ============================================================================
 * What this module does:
 * - Provides a unified, predictable error response contract across all API routes:
 *   `{ success: false, error: { code, message, details } }`
 * - Defines `AppError` for throwing domain-specific errors with explicit HTTP statuses.
 * - Formats Zod schema validation errors with clean field paths.
 * - Prevents security information leakage by masking internal 500 error stack traces.
 */

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '../types/api';

/**
 * Custom application error class for controlled domain exceptions.
 * Example: `throw new AppError('Insufficient stock.', 400, 'INSUFFICIENT_STOCK')`
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Express 4-argument error-handling middleware.
 * Must be registered AFTER all API route handlers in `server/app.ts`.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
) {
  // 1. Handle Zod input validation errors (e.g., malformed JSON payload)
  if (err instanceof ZodError) {
    const issues = err.issues || (err as any).errors || [];
    const details = issues.map((e: any) => ({
      path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details,
      },
    });
  }

  // 2. Handle controlled domain errors (e.g. Insufficient Stock, Duplicate SKU, Forbidden)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 3. Fallback for unhandled unexpected runtime crashes (e.g. database disconnect)
  // Log full stack trace to server console for debugging, but never send to client
  console.error('[Unhandled Server Error]', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
}
