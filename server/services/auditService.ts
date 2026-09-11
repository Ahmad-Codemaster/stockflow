import prisma from '../db';
import type { Prisma } from '@prisma/client';
import logger from '../logger';

export class AuditService {
  static async log(
    params: {
      userId?: string | null;
      action: string;
      entity: string;
      entityId?: string | null;
      details?: Record<string, any> | string;
      ipAddress?: string | null;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    try {
      return await client.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
          details:
            typeof params.details === 'object'
              ? JSON.stringify(params.details)
              : params.details ?? null,
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch (err: any) {
      logger.error('AuditService.log failed', { action: params.action, entity: params.entity, entityId: params.entityId, error: err?.message });
      if (tx) throw err;
    }
  }

  static async listLogs(limit = 100) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
