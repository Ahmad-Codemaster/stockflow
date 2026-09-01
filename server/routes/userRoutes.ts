import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All user management routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', UserController.list);
router.post('/', UserController.create);
router.get('/audit-logs', UserController.listAuditLogs);
router.get('/:id', UserController.getById);
router.put('/:id', UserController.update);
router.patch('/:id/deactivate', UserController.deactivate);
router.delete('/:id', UserController.delete);

export default router;
