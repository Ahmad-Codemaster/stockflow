import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AuditService } from '../services/auditService';
import { UserService } from '../services/userService';
import type { AuthenticatedRequest } from '../types/api';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid corporate email address'),
  role: z.enum(['ADMIN', 'STAFF']),
  status: z.enum(['Active', 'Inactive']).optional(),
  password: z
    .preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), z.string().min(6, 'Password must be at least 6 characters').optional()),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email('Please enter a valid corporate email address').optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  password: z
    .preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), z.string().min(6, 'Password must be at least 6 characters').optional()),
});

export class UserController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await UserService.listUsers();
      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createUserSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const user = await UserService.createUser(parsed, req.user!.id, ipAddress);
      return res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = updateUserSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;

      const user = await UserService.updateUser(
        req.params.id,
        parsed,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const user = await UserService.deactivateUser(
        req.params.id,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await UserService.deleteUser(
        req.params.id,
        req.user!.id,
        ipAddress
      );
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 100;
      const logs = await AuditService.listLogs(limit);
      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
