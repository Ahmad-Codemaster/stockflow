import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', InventoryController.list);
router.post('/stock-in', InventoryController.stockIn);
router.post('/stock-out', InventoryController.stockOut);
router.get('/transactions', InventoryController.listTransactions);
router.get('/transactions/:id', InventoryController.getTransactionById);

export default router;
