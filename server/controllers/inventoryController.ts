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
import { InventoryService } from '../services/inventoryService';
import type { AuthenticatedRequest } from '../types/api';
import {
  stockInSchema,
  stockOutSchema,
  stockAdjustSchema,
  inventoryQuerySchema,
  transactionQuerySchema,
} from '../schemas/inventorySchemas';

export {
  stockInSchema,
  stockOutSchema,
  stockAdjustSchema,
  inventoryQuerySchema,
  transactionQuerySchema,
};

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
