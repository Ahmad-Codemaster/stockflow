/**
 * ============================================================================
 * PRODUCT ROUTER (`/api/products`)
 * ============================================================================
 * What this router does:
 * - Mounts catalog query and modification endpoints.
 * 
 * RBAC Matrix:
 * - READ (GET /, GET /:id): Open to all authenticated users (ADMIN and STAFF).
 *   Staff must be able to search and view products to fulfill stock orders.
 * - WRITE (POST /, PUT /:id, DELETE /:id): RESTRICTED to ADMIN only via `requireRole('ADMIN')`.
 *   Prevents unauthorized warehouse staff from modifying prices, adding products, or deleting inventory.
 */

import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Enforce authentication across all catalog routes
router.use(requireAuth);

// Read endpoints: accessible by both ADMIN and STAFF
router.get('/', ProductController.list);
router.get('/:id', ProductController.getById);

// Mutation endpoints: strictly guarded for ADMIN role only (returns 403 Forbidden to Staff)
router.post('/', requireRole('ADMIN'), ProductController.create);
router.put('/:id', requireRole('ADMIN'), ProductController.update);
router.delete('/:id', requireRole('ADMIN'), ProductController.delete);

export default router;
