import type { Response } from 'express';
import { CategoryService } from '../services/categoryService';
import type { AuthenticatedRequest } from '../types/api';
import { categorySchema, categoryUpdateSchema } from '../schemas/categorySchemas';

export { categorySchema, categoryUpdateSchema };

export class CategoryController {
  static async list(_req: AuthenticatedRequest, res: Response) {
    const categories = await CategoryService.listCategories();
    return res.status(200).json({ success: true, data: categories });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const category = await CategoryService.createCategory(
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(201).json({ success: true, data: category });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    const category = await CategoryService.updateCategory(
      req.params.id,
      req.body,
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
