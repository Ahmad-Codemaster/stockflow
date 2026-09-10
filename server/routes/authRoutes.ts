/**
 * ============================================================================
 * AUTHENTICATION ROUTER (`/api/auth`)
 * ============================================================================
 * What this router does:
 * - Mounts login, logout, session restoration (`/me`), and password change endpoints.
 * - Protects the login endpoint with an IP-based sliding window rate limiter.
 * - Enforces `requireAuth` on private account endpoints (`/me`, `/change-password`).
 */

import { Router } from 'express';
import {
  AuthController,
  changePasswordSchema,
  loginSchema,
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';

const router = Router();

// Rate limiter: Max 20 login attempts per 15 minutes per IP address (brute-force defense)
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts from this IP address. Please wait 15 minutes before trying again.',
});

// Public endpoints
router.post('/login', loginLimiter, validateBody(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);

// Protected endpoints (require valid session cookie)
router.get('/me', requireAuth, AuthController.me);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), AuthController.changePassword);

export default router;
