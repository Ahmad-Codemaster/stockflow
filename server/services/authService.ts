import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export class AuthService {
  static async login(email: string, password: string, ipAddress?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'Inactive') {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    // Generate secure 64-character random session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF',
      status: user.status as 'Active' | 'Inactive',
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    return { user: safeUser, sessionToken, expiresAt };
  }

  static async logout(sessionId: string, userId?: string, ipAddress?: string) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});

    if (userId) {
      await AuditService.log({
        userId,
        action: 'USER_LOGOUT',
        entity: 'SESSION',
        entityId: sessionId,
        ipAddress,
      });
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ) {
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await AuditService.log({
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'USER',
      entityId: userId,
      ipAddress,
    });
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return user;
  }
}
