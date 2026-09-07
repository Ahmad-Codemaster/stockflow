/**
 * ============================================================================
 * INVENTORY ROUTES (`/api/inventory`)
 * ============================================================================
 * What this router does:
 * - Mounts endpoints for inventory listing, stock-in, stock-out, and transaction history.
 * - Enforces `requireAuth` across ALL routes (unauthenticated users cannot view or mutate inventory).
 * 
 * RBAC Note:
 * - Both ADMIN and STAFF have access to these routes because daily warehouse
 *   operations require floor staff to receive stock and fulfill orders.
 */

import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect all inventory routes with session authentication
router.use(requireAuth);

router.get('/', InventoryController.list);
router.post('/stock-in', InventoryController.stockIn);
router.post('/stock-out', InventoryController.stockOut);
router.get('/transactions', InventoryController.listTransactions);
router.get('/transactions/:id', InventoryController.getTransactionById);

export default router;
