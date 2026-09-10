import { Router } from 'express';
import {
  CategoryController,
  categorySchema,
  categoryUpdateSchema,
} from '../controllers/categoryController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common';

const router = Router();

router.use(requireAuth);

router.get('/', CategoryController.list);
router.post('/', requireRole('ADMIN'), validateBody(categorySchema), CategoryController.create);
router.put('/:id', requireRole('ADMIN'), validateParams(idParamSchema), validateBody(categoryUpdateSchema), CategoryController.update);
router.delete('/:id', requireRole('ADMIN'), validateParams(idParamSchema), CategoryController.delete);

export default router;
