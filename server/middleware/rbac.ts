import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/api';
import { AppError } from './errorHandler';

export function requireRole(...allowedRoles: Array<'ADMIN' | 'STAFF'>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. You do not have permission to perform this action (${req.user.role} role is insufficient).`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
