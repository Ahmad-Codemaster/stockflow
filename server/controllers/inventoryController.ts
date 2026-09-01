import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { InventoryService } from '../services/inventoryService';
import type { AuthenticatedRequest } from '../types/api';

const stockInSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  supplierId: z.string().nullable().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const stockOutSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export class InventoryController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const inventory = await InventoryService.listInventory({
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        status: req.query.status as string,
      });
      return res.status(200).json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  }

  static async stockIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = stockInSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await InventoryService.stockIn(
        parsed,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async stockOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = stockOutSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await InventoryService.stockOut(
        parsed,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const txns = await InventoryService.listTransactions({
        type: req.query.type as string,
        productId: req.query.productId as string,
        limit: Number(req.query.limit) || 100,
      });
      return res.status(200).json({ success: true, data: txns });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const txn = await InventoryService.getTransactionById(req.params.id);
      return res.status(200).json({ success: true, data: txn });
    } catch (error) {
      next(error);
    }
  }
}
