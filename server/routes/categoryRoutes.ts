import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth);

router.get('/', CategoryController.list);
router.post('/', requireRole('ADMIN'), CategoryController.create);
router.put('/:id', requireRole('ADMIN'), CategoryController.update);
router.delete('/:id', requireRole('ADMIN'), CategoryController.delete);

export default router;
