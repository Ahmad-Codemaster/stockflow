/**
 * ============================================================================
 * INVENTORY CONTROLLER — HTTP Request Orchestration
 * ============================================================================
 * What this controller does:
 * - Parses and validates incoming HTTP request bodies using Zod schemas.
 * - Extracts client IP address and authenticated user ID (`req.user.id`).
 * - Delegates execution to `InventoryService`.
 * - Returns standardized JSON responses: `{ success: true, data: ... }`.
 */

import type { Response } from 'express';
import { z } from 'zod';
import { InventoryService } from '../services/inventoryService';
import type { AuthenticatedRequest } from '../types/api';

// Validation schema for Stock-In request payload
export const stockInSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  supplierId: z.string().nullable().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Validation schema for Stock-Out request payload
export const stockOutSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Validation schema for Stock-Adjustment request payload
export const stockAdjustSchema = z
  .object({
    productId: z.string().min(1, 'Product is required'),
    targetQuantity: z.number().int().min(0, 'Target quantity cannot be negative').optional(),
    quantity: z.number().int().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(data => data.targetQuantity !== undefined || data.quantity !== undefined, {
    message: 'Either targetQuantity or quantity delta must be provided',
  });

export const inventoryQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().trim().optional(),
  status: z.enum(['All', 'all', 'In Stock', 'Low Stock', 'Out of Stock']).optional(),
});

export const transactionQuerySchema = z.object({
  type: z.enum(['all', 'ALL', 'stock_in', 'STOCK_IN', 'stock_out', 'STOCK_OUT', 'adjustment', 'ADJUSTMENT', 'Stock In', 'Stock Out', 'Adjustment']).optional(),
  productId: z.string().trim().optional(),
  limit: z
    .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : 100), z.number().int().positive().max(500))
    .optional(),
});

export class InventoryController {
  /**
   * GET /api/inventory: List live stock levels with query filters
   */
  static async list(req: AuthenticatedRequest, res: Response) {
    const query = req.query as any;
    const inventory = await InventoryService.listInventory({
      search: query.search,
      categoryId: query.categoryId,
      status: query.status,
    });
    return res.status(200).json({ success: true, data: inventory });
  }

  /**
   * POST /api/inventory/stock-in: Record receiving restock
   */
  static async stockIn(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await InventoryService.stockIn(
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }

  /**
   * POST /api/inventory/stock-out: Record order fulfillment deduction
   */
  static async stockOut(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await InventoryService.stockOut(
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }

  /**
   * POST /api/inventory/adjust: Record inventory count adjustment / shrinkage
   */
  static async adjust(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await InventoryService.stockAdjustment(
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }

  /**
   * GET /api/inventory/transactions: Retrieve stock ledger
   */
  static async listTransactions(req: AuthenticatedRequest, res: Response) {
    const query = req.query as any;
    const txns = await InventoryService.listTransactions({
      type: query.type,
      productId: query.productId,
      limit: query.limit || 100,
    });
    return res.status(200).json({ success: true, data: txns });
  }

  /**
   * GET /api/inventory/transactions/:id: Retrieve single transaction receipt
   */
  static async getTransactionById(req: AuthenticatedRequest, res: Response) {
    const txn = await InventoryService.getTransactionById(req.params.id);
    return res.status(200).json({ success: true, data: txn });
  }
}
