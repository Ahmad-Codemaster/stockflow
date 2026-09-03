import express from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { wipeStoreData } from '../seed';

const router = express.Router();

// All system maintenance operations require ADMIN role and active session
router.use(requireAuth, requireRole('ADMIN'));

/**
 * POST /api/system/wipe
 * Completely wipes all products, inventory, categories, suppliers, and movement logs.
 * Preserves user accounts and active login sessions so the operator can start with a clean empty store.
 */
router.post('/wipe', async (_req, res, next) => {
  try {
    await wipeStoreData();
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

