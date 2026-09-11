import type { Response } from 'express';
import { AuditService } from '../services/auditService';
import { UserService } from '../services/userService';
import type { AuthenticatedRequest } from '../types/api';
import {
  createUserSchema,
  updateUserSchema,
  auditLogQuerySchema,
} from '../schemas/userSchemas';

export { createUserSchema, updateUserSchema, auditLogQuerySchema };

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
    const ipAddress = req.ip || req.socket.remoteAddress;
    const user = await UserService.createUser(req.body, req.user!.id, ipAddress);
    return res.status(201).json({ success: true, data: user });
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const user = await UserService.updateUser(
      req.params.id,
      req.body,
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
    const query = req.query as any;
    const limit = query.limit || 100;
    const logs = await AuditService.listLogs(limit);
    return res.status(200).json({ success: true, data: logs });
  }
}
