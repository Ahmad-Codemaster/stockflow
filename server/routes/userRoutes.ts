/**
 * ============================================================================
 * USER MANAGEMENT & AUDIT LOG ROUTER (`/api/users`)
 * ============================================================================
 * What this router does:
 * - Mounts employee provisioning, role assignment, account deactivation, and deletion endpoints.
 * - Exposes administrative audit logs (`/api/users/audit-logs`).
 * 
 * Strict RBAC Isolation:
 * - Both `requireAuth` AND `requireRole('ADMIN')` are mounted at the router level.
 * - Regular STAFF users are completely blocked with HTTP 403 Forbidden on all routes here.
 */

import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// ALL user management and audit log routes are restricted exclusively to administrators
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', UserController.list);
router.post('/', UserController.create);
router.get('/audit-logs', UserController.listAuditLogs);
router.get('/:id', UserController.getById);
router.put('/:id', UserController.update);
router.patch('/:id/deactivate', UserController.deactivate);
router.delete('/:id', UserController.delete);

export default router;
