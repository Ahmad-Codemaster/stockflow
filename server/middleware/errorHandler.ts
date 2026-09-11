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
import { Prisma } from '@prisma/client';
import type { ApiResponse } from '../types/api';
import logger from '../logger';

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

  // 2. Handle Prisma database-level errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: Record to update/delete not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found.',
        },
      });
    }

    // P2002: Unique constraint violation (e.g. duplicate SKU or email)
    if (err.code === 'P2002') {
      const field = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(', ') : 'field';
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `A record with this ${field} already exists.`,
        },
      });
    }

    // P2004 / P2010: Check constraint violation (e.g. quantity < 0 breaching DB constraint)
    if (err.code === 'P2004' || err.code === 'P2010') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Operation would result in an invalid inventory state (quantity below zero).',
        },
      });
    }
  }

  // 3. Handle controlled domain errors (e.g. Insufficient Stock, Duplicate SKU, Forbidden)
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

  // 4. Fallback for unhandled unexpected runtime crashes (e.g. database disconnect)
  // Emit structured log with full context, but never expose stack trace to client.
  logger.error('Unhandled server error', {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
}
