/**
 * ============================================================================
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE (`requireRole`)
 * ============================================================================
 * What this middleware does:
 * - Enforces role-based permissions on administrative API routes.
 * - Compares the authenticated user's role (`ADMIN` or `STAFF`) against allowed roles.
 * - Rejects unauthorized requests with HTTP 403 FORBIDDEN.
 * 
 * Defense-in-Depth Principle:
 * - Client-side UI element hiding (hiding the "Users" tab for Staff) is purely for UX.
 * - True security is ALWAYS enforced here on the server. Even if a user crafts a direct
 *   `POST /api/products` or `GET /api/users` request in Postman, this middleware blocks them.
 */

import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/api';
import { AppError } from './errorHandler';

/**
 * Middleware factory that restricts route access to specific roles
 * Example usage: `router.post('/users', requireAuth, requireRole('ADMIN'), UserController.create)`
 */
export function requireRole(...allowedRoles: Array<'ADMIN' | 'STAFF'>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // 1. Ensure user has already passed authentication
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    // 2. Verify that user's role is in the list of permitted roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. You do not have permission to perform this action (${req.user.role} role is insufficient).`,
          403,
          'FORBIDDEN'
        )
      );
    }

    // Role authorized -> proceed to controller
    next();
  };
}
