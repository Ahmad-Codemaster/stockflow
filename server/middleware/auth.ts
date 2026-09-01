import type { NextFunction, Response } from 'express';
import prisma from '../db';
import type { AuthenticatedRequest } from '../types/api';
import { AppError } from './errorHandler';

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const sessionId =
      req.cookies?.stockflow_session ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!sessionId) {
      throw new AppError('Authentication required. No session found.', 401, 'UNAUTHORIZED');
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new AppError('Invalid or expired session. Please log in again.', 401, 'UNAUTHORIZED');
    }

    if (session.expiresAt < new Date()) {
      // Session expired -> remove from DB
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      throw new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }

    if (session.user.status === 'Inactive') {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as 'ADMIN' | 'STAFF',
      status: session.user.status as 'Active' | 'Inactive',
      avatar: session.user.avatar,
      createdAt: session.user.createdAt,
    };
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
}
