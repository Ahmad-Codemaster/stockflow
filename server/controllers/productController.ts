import type { Response } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/productService';
import type { AuthenticatedRequest } from '../types/api';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().nullable().optional(),
  price: z.number().nonnegative('Price cannot be negative'),
  initialStock: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative('Reorder level cannot be negative'),
  description: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  description: z.string().optional(),
});

export const productQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().trim().optional(),
  status: z.enum(['All', 'all', 'In Stock', 'Low Stock', 'Out of Stock']).optional(),
  includeArchived: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
});

export class ProductController {
  static async list(req: AuthenticatedRequest, res: Response) {
    const query = req.query as any;
    const products = await ProductService.listProducts({
      search: query.search,
      categoryId: query.categoryId,
      status: query.status,
      includeArchived: query.includeArchived === true,
    });
    return res.status(200).json({ success: true, data: products });
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    const product = await ProductService.getProductById(req.params.id);
    return res.status(200).json({ success: true, data: product });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const product = await ProductService.createProduct(
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(201).json({ success: true, data: product });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const product = await ProductService.updateProduct(
      req.params.id,
      req.body,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: product });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await ProductService.deleteProduct(
      req.params.id,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }
}
