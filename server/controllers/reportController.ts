import type { NextFunction, Response } from 'express';
import { ReportService } from '../services/reportService';
import type { AuthenticatedRequest } from '../types/api';

export class ReportController {
  static async summary(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getSummary();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async movement(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getMovement();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async lowStock(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getLowStock();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async valuation(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getValuation();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
