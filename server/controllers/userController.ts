import type { Response } from 'express';
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
  static async list(_req: AuthenticatedRequest, res: Response) {
    const users = await UserService.listUsers();
    return res.status(200).json({ success: true, data: users });
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    const user = await UserService.getUserById(req.params.id);
    return res.status(200).json({ success: true, data: user });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    const parsed = createUserSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;

    const user = await UserService.createUser(parsed, req.user!.id, ipAddress);
    return res.status(201).json({ success: true, data: user });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const parsed = updateUserSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;

    const user = await UserService.updateUser(
      req.params.id,
      parsed,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: user });
  }

  static async deactivate(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const user = await UserService.deactivateUser(
      req.params.id,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: user });
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await UserService.deleteUser(
      req.params.id,
      req.user!.id,
      ipAddress
    );
    return res.status(200).json({ success: true, data: result });
  }

  static async listAuditLogs(req: AuthenticatedRequest, res: Response) {
    const limit = Number(req.query.limit) || 100;
    const logs = await AuditService.listLogs(limit);
    return res.status(200).json({ success: true, data: logs });
  }
}
