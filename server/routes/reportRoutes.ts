import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { reportQuerySchema } from '../schemas/reportSchemas';

const router = Router();

router.use(requireAuth);

router.get('/summary', validateQuery(reportQuerySchema), ReportController.summary);
router.get('/movement', validateQuery(reportQuerySchema), ReportController.movement);
router.get('/low-stock', validateQuery(reportQuerySchema), ReportController.lowStock);
router.get('/valuation', validateQuery(reportQuerySchema), ReportController.valuation);

export default router;
