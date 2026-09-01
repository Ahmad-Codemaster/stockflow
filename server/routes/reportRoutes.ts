import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/summary', ReportController.summary);
router.get('/movement', ReportController.movement);
router.get('/low-stock', ReportController.lowStock);
router.get('/valuation', ReportController.valuation);

export default router;
