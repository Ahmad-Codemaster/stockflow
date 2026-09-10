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
import {
  InventoryController,
  inventoryQuerySchema,
  stockAdjustSchema,
  stockInSchema,
  stockOutSchema,
  transactionQuerySchema,
} from '../controllers/inventoryController';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { idParamSchema } from '../schemas/common';

const router = Router();

// Protect all inventory routes with session authentication
router.use(requireAuth);

router.get('/', validateQuery(inventoryQuerySchema), InventoryController.list);
router.post('/stock-in', validateBody(stockInSchema), InventoryController.stockIn);
router.post('/stock-out', validateBody(stockOutSchema), InventoryController.stockOut);
router.post('/adjust', validateBody(stockAdjustSchema), InventoryController.adjust);
router.get('/transactions', validateQuery(transactionQuerySchema), InventoryController.listTransactions);
router.get('/transactions/:id', validateParams(idParamSchema), InventoryController.getTransactionById);

export default router;
