import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(requireAuth);

router.get('/', ProductController.list);
router.get('/:id', ProductController.getById);
router.post('/', requireRole('ADMIN'), ProductController.create);
router.put('/:id', requireRole('ADMIN'), ProductController.update);
router.delete('/:id', requireRole('ADMIN'), ProductController.delete);

export default router;
