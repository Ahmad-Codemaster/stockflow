import express from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { seedDatabase, wipeStoreData } from '../seed';

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

/**
 * POST /api/system/seed
 * Loads standard demo data (products, categories, suppliers, transactions).
 * Preserves active login sessions so the operator is NOT logged out.
 */
router.post('/seed', async (_req, res, next) => {
  try {
    await seedDatabase(true);
    res.status(200).json({
      success: true,
      data: {
        message: 'Factory demo fixtures successfully loaded.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/system/reset
 * Legacy/convenience alias for seed with active session preservation.
 */
router.post('/reset', async (_req, res, next) => {
  try {
    await seedDatabase(true);
    res.status(200).json({
      success: true,
      data: {
        message: 'System database successfully reset to factory demo fixtures.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
