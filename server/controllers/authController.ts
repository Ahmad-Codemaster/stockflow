/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER — Session Issuance & Cookie Management
 * ============================================================================
 * What this controller does:
 * - Validates login and password change inputs via Zod schemas.
 * - Issues `stockflow_session` cookie with strict security flags (`HttpOnly`, `SameSite=Lax`).
 * - Cleans up cookies on logout and coordinates database session invalidation.
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import type { AuthenticatedRequest } from '../types/api';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
  /**
   * POST /api/auth/login: Verify credentials and issue HttpOnly session cookie
   */
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const { user, sessionToken, expiresAt } = await AuthService.login(
      email,
      password,
      ipAddress
    );

    /**
     * CRITICAL SECURITY ARCHITECTURE:
     * - `httpOnly: true`: Blocks client-side JavaScript (`document.cookie`) from accessing the token.
     *   This makes the session completely immune to Cross-Site Scripting (XSS) token theft.
     * - `secure: true`: In production, forces transmission over HTTPS only.
     * - `sameSite: 'lax'`: Mitigates Cross-Site Request Forgery (CSRF) on cross-site requests.
     */
    res.cookie('stockflow_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  }

  /**
   * POST /api/auth/logout: Invalidate session in DB and clear browser cookie
   */
  static async logout(req: AuthenticatedRequest, res: Response) {
    const sessionId =
      req.sessionId ||
      req.cookies?.stockflow_session ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    // 1. Delete session from PostgreSQL database
    if (sessionId) {
      const ipAddress = req.ip || req.socket.remoteAddress;
      await AuthService.logout(sessionId, req.user?.id, ipAddress);
    }

    // 2. Clear cookie in user's browser
    res.clearCookie('stockflow_session', { path: '/' });

    return res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  }

  /**
   * GET /api/auth/me: Retrieve active authenticated user profile
   */
  static async me(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  }

  /**
   * POST /api/auth/change-password: Update user credentials
   */
  static async changePassword(req: AuthenticatedRequest, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    await AuthService.changePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      ipAddress
    );

    return res.status(200).json({
      success: true,
      data: { message: 'Password updated successfully.' },
    });
  }
}
