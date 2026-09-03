import type { Response } from 'express';
import { z } from 'zod';
import { CategoryService } from '../services/categoryService';
import type { AuthenticatedRequest } from '../types/api';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export class CategoryController {
  static async list(_req: AuthenticatedRequest, res: Response) {
    const categories = await CategoryService.listCategories();
    return res.status(200).json({ success: true, data: categories });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const parsed = categorySchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;

    const category = await CategoryService.createCategory(
      parsed,
      req.user!.id,
      ipAddress
    );
    return res.status(201).json({ success: true, data: category });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const parsed = categorySchema.partial().parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;

    const category = await CategoryService.updateCategory(
      req.params.id,
      parsed,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: category });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await CategoryService.deleteCategory(
      req.params.id,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }
}
