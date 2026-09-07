/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE (`requireAuth`)
 * ============================================================================
 * What this middleware does:
 * - Guards protected routes by verifying that the incoming request has a valid session.
 * - Extracts session token from either HttpOnly cookie (`stockflow_session`) or Bearer header.
 * - Queries PostgreSQL `sessions` table and fetches the associated user.
 * - Enforces session expiration and auto-purges expired sessions from the database.
 * - Enforces instant deactivation: blocks inactive employees with HTTP 403.
 * - Attaches safe user metadata to `req.user` for downstream controllers to access.
 */

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
    // 1. Extract session token: check HttpOnly cookie first (web app), then Bearer header (API tools)
    const sessionId =
      req.cookies?.stockflow_session ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!sessionId) {
      throw new AppError('Authentication required. No session found.', 401, 'UNAUTHORIZED');
    }

    // 2. Query database for session and join user record
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new AppError('Invalid or expired session. Please log in again.', 401, 'UNAUTHORIZED');
    }

    // 3. Check for session expiration (auto-purge expired tokens)
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      throw new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }

    // 4. CRITICAL DEFENSE: Reject deactivated users immediately, even if session exists
    if (session.user.status === 'Inactive') {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    // 5. Populate req.user so downstream controllers know who performed the action
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

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    next(error);
  }
}
