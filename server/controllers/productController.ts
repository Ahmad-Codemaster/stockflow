import type { Response } from 'express';
import { ProductService } from '../services/productService';
import type { AuthenticatedRequest } from '../types/api';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../schemas/productSchemas';

export { createProductSchema, updateProductSchema, productQuerySchema };

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
