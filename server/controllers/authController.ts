import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import type { AuthenticatedRequest } from '../types/api';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const { user, sessionToken, expiresAt } = await AuthService.login(
        email,
        password,
        ipAddress
      );

      // Set secure HTTP-only cookie
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
          sessionId: sessionToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessionId =
        req.sessionId ||
        req.cookies?.stockflow_session ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.slice(7)
          : null);

      if (sessionId) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        await AuthService.logout(sessionId, req.user?.id, ipAddress);
      }

      res.clearCookie('stockflow_session', { path: '/' });

      return res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
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
    } catch (error) {
      next(error);
    }
  }
}
