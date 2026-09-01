import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth);

router.get('/', SupplierController.list);
router.post('/', requireRole('ADMIN'), SupplierController.create);
router.put('/:id', requireRole('ADMIN'), SupplierController.update);
router.delete('/:id', requireRole('ADMIN'), SupplierController.delete);

export default router;
