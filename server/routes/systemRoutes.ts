import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { strictLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from '../services/auditService';
import { wipeStoreData } from '../seed';
import type { AuthenticatedRequest } from '../types/api';

const router = express.Router();

// All system maintenance operations require ADMIN role and active session
router.use(requireAuth, requireRole('ADMIN'));

/**
 * POST /api/system/wipe
 * Completely wipes all products, inventory, categories, suppliers, and movement logs.
 * Preserves user accounts, active login sessions, and audit logs.
 * Requires administrator password re-verification (Sudo Mode) to prevent accidental clicks or CSRF.
 * Rate limited to prevent automated malicious abuse.
 */
router.post('/wipe', strictLimiter, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      throw new AppError('Administrator password is required to confirm data wipe.', 400, 'PASSWORD_REQUIRED');
    }

    const caller = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!caller) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(password, caller.passwordHash);
    if (!isMatch) {
      throw new AppError('Incorrect administrator password. Wipe aborted.', 401, 'INVALID_CREDENTIALS');
    }

    await wipeStoreData();

    // Log the wipe event with the initiating administrator's identity
    await AuditService.log({
      userId: req.user!.id,
      action: 'SYSTEM_WIPE',
      entity: 'DATABASE',
      details: { message: 'All store catalog, inventory, and transaction movements wiped by administrator' },
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'All catalog items, inventory, transactions, categories, and suppliers wiped. Store is now clean and empty.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
