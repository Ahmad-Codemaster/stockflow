import type { Response } from 'express';
import { z } from 'zod';
import { SupplierService } from '../services/supplierService';
import type { AuthenticatedRequest } from '../types/api';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  leadTime: z.number().nonnegative().optional(),
});

export const supplierUpdateSchema = supplierSchema.partial();

export class SupplierController {
  static async list(_req: AuthenticatedRequest, res: Response) {
    const suppliers = await SupplierService.listSuppliers();
    return res.status(200).json({ success: true, data: suppliers });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const supplier = await SupplierService.createSupplier(
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(201).json({ success: true, data: supplier });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const supplier = await SupplierService.updateSupplier(
      req.params.id,
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: supplier });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await SupplierService.deleteSupplier(
      req.params.id,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }
}
