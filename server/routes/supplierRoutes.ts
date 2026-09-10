import { Router } from 'express';
import {
  SupplierController,
  supplierSchema,
  supplierUpdateSchema,
} from '../controllers/supplierController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common';

const router = Router();

router.use(requireAuth);

router.get('/', SupplierController.list);
router.post('/', requireRole('ADMIN'), validateBody(supplierSchema), SupplierController.create);
router.put('/:id', requireRole('ADMIN'), validateParams(idParamSchema), validateBody(supplierUpdateSchema), SupplierController.update);
router.delete('/:id', requireRole('ADMIN'), validateParams(idParamSchema), SupplierController.delete);

export default router;
