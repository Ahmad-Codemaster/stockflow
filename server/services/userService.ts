/**
 * ============================================================================
 * USER MANAGEMENT SERVICE — Administrative Identity & Safeguards
 * ============================================================================
 * What this module does:
 * - Admin-only user provisioning, role assignments, and profile updates.
 * - Enforces Last-Administrator Protection Guards to prevent system lockout.
 * - Enforces immediate session termination when an employee is deactivated.
 * - Preserves relational audit trail integrity when a user account is removed.
 */

import bcrypt from 'bcryptjs';
import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export class UserService {
  /**
   * LIST USERS: Fetch all user accounts (passwords omitted)
   */
  static async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GET USER BY ID: Fetch single user profile
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return user;
  }

  /**
   * CREATE USER: Provision a new team member
   * 
   * Invariants:
   * - Email normalized to lowercase and checked for uniqueness (HTTP 409).
   * - Default password hashed with Bcrypt (10 salt rounds).
   * - Action recorded in immutable audit log.
   */
  static async createUser(
    data: {
      name: string;
      email: string;
      password?: string;
      role: 'ADMIN' | 'STAFF';
      status?: 'Active' | 'Inactive';
    },
    adminUserId: string,
    ipAddress?: string
  ) {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Enforce email uniqueness constraint
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new AppError('A user with this email address already exists.', 409, 'DUPLICATE_EMAIL');
    }

    // Default password if not provided by administrator
    const defaultPassword = data.password || 'StockFlow@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: data.role,
        status: data.status || 'Active',
      },
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

    // Record creation in audit log
    await AuditService.log({
      userId: adminUserId,
      action: 'USER_CREATE',
      entity: 'USER',
      entityId: user.id,
      details: { name: user.name, email: user.email, role: user.role },
      ipAddress,
    });

    return user;
  }

  /**
   * UPDATE USER: Modify profile, role, password, or status
   * 
   * Critical Safeguards:
   * 1. LAST-ADMIN GUARD: Prevents demoting or deactivating the last active administrator.
   * 2. IMMEDIATE SESSION PURGE: If a user is deactivated ('Inactive'), all their active
   *    sessions are deleted from PostgreSQL immediately to revoke access on their next click.
   */
  static async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: 'ADMIN' | 'STAFF';
      status?: 'Active' | 'Inactive';
      password?: string;
    },
    adminUserId: string,
    ipAddress?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    // LAST-ADMIN GUARD: Prevent demoting the last active admin to staff
    if (user.role === 'ADMIN' && data.role === 'STAFF') {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'Active' } });
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Cannot demote the last administrator. At least one active admin account must exist at all times.',
          400,
          'LAST_ADMIN'
        );
      }
    }

    // LAST-ADMIN GUARD: Prevent deactivating the last active admin
    if (user.role === 'ADMIN' && user.status === 'Active' && data.status === 'Inactive') {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'Active' } });
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Cannot deactivate the last administrator. At least one active admin account must exist at all times.',
          400,
          'LAST_ADMIN'
        );
      }
    }

    const updateData: any = {};

    if (data.name) updateData.name = data.name.trim();

    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== id) {
          throw new AppError('A user with this email already exists.', 409, 'DUPLICATE_EMAIL');
        }
        updateData.email = normalizedEmail;
      }
    }

    if (data.role) updateData.role = data.role;
    if (data.password) {
      if (data.password.length < 8) {
        throw new AppError('Password must be at least 8 characters long.', 400, 'VALIDATION_ERROR');
      }
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (data.status) {
      updateData.status = data.status;

      // CRITICAL SECURITY INVARIANT: If user is deactivated, immediately purge all active sessions!
      if (data.status === 'Inactive') {
        await prisma.session.deleteMany({ where: { userId: id } });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await AuditService.log({
      userId: adminUserId,
      action: 'USER_UPDATE',
      entity: 'USER',
      entityId: id,
      details: { changes: updateData },
      ipAddress,
    });

    return updated;
  }

  /**
   * DEACTIVATE USER: Shortcut to set status to Inactive and purge active sessions
   */
  static async deactivateUser(id: string, adminUserId: string, ipAddress?: string) {
    return this.updateUser(id, { status: 'Inactive' }, adminUserId, ipAddress);
  }

  /**
   * DELETE USER WORKFLOW
   * 
   * Safeguards:
   * 1. Self-Deletion Forbidden: An admin cannot delete their own active account.
   * 2. Last-Admin Guard: Prevents deleting the sole remaining administrator.
   * 3. Referential Integrity Preservation: Reassigns stock transactions to admin
   *    and nullifies user ID in audit logs so historical business reports never fail.
   */
  static async deleteUser(id: string, adminUserId: string, ipAddress?: string) {
    // Prevent accidental self-deletion
    if (id === adminUserId) {
      throw new AppError('You cannot delete your own active administrator account.', 400, 'SELF_DELETION_FORBIDDEN');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    // LAST-ADMIN GUARD: Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'Active' } });
      if (activeAdminCount <= 1) {
        throw new AppError(
          'Cannot delete the last administrator account. At least one active admin must exist at all times.',
          400,
          'LAST_ADMIN'
        );
      }
    }

    // 1. Delete all active sessions for this user
    await prisma.session.deleteMany({ where: { userId: id } });

    // 2. Reassign any existing stock transactions performed by this user to the admin to maintain historical movement integrity
    await prisma.stockTransaction.updateMany({
      where: { performedById: id },
      data: { performedById: adminUserId },
    });

    // 3. Nullify user reference in audit logs
    await prisma.auditLog.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    // 4. Delete user record
    await prisma.user.delete({ where: { id } });

    // 5. Log audit action
    await AuditService.log({
      userId: adminUserId,
      action: 'USER_DELETE',
      entity: 'USER',
      entityId: id,
      details: { name: user.name, email: user.email, role: user.role },
      ipAddress,
    });

    return { message: `User "${user.name}" removed successfully.` };
  }
}
