import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { SupplierService } from '../services/supplierService';
import type { AuthenticatedRequest } from '../types/api';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  leadTime: z.number().nonnegative().optional(),
});

export class SupplierController {
  static async list(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const suppliers = await SupplierService.listSuppliers();
      return res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = supplierSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const supplier = await SupplierService.createSupplier(
        parsed,
        req.user!.id,
        ipAddress
      );
      return res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = supplierSchema.partial().parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const supplier = await SupplierService.updateSupplier(
        req.params.id,
        parsed,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await SupplierService.deleteSupplier(
        req.params.id,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
