/**
 * ============================================================================
 * AUTHENTICATION SERVICE — Session Security & Password Management
 * ============================================================================
 * What this module does:
 * - Authenticates users using cryptographic Bcrypt password verification.
 * - Enforces account status checks (blocks deactivated users).
 * - Issues cryptographically secure, random 64-character session tokens.
 * - Stores sessions in PostgreSQL to support INSTANT session revocation.
 * - Handles password changes with Bcrypt re-hashing (10 salt rounds).
 * 
 * Why Database-Backed Sessions instead of Stateless JWTs?
 * - If an employee is fired or their account is deactivated, we can DELETE their
 *   session row from PostgreSQL immediately. On their next request, they are blocked.
 * - Stateless JWTs cannot be revoked before their expiration time without maintaining
 *   an in-memory blocklist (e.g. in Redis).
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export class AuthService {
  /**
   * LOGIN WORKFLOW
   * 
   * Steps:
   * 1. Normalize email to lowercase (e.g., 'Ahmad@Test.com' -> 'ahmad@test.com').
   * 2. Query user by email. If not found, return generic 401 (prevents user enumeration).
   * 3. Verify password using `bcrypt.compare` (constant-time check against salt hash).
   * 4. Verify account is Active (deactivated users return 403 ACCOUNT_INACTIVE).
   * 5. Generate secure 64-character random token using Node's crypto module.
   * 6. Insert session row into PostgreSQL with 7-day expiration.
   * 7. Record login in `audit_logs` table.
   * 8. Return safe user object (excluding `passwordHash`) and session token.
   */
  static async login(email: string, password: string, ipAddress?: string, role?: 'ADMIN' | 'STAFF') {
    // 1. Normalize email to prevent duplicate accounts with different casings
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 2. Generic error message prevents revealing whether an email exists
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // 3. Compare plaintext candidate password against stored Bcrypt hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // 4. Block deactivated accounts immediately
    if (user.status === 'Inactive') {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    // 5. Enforce role booth separation (prevent staff from logging into admin console and vice-versa)
    if (role && user.role !== role) {
      throw new AppError(
        role === 'ADMIN'
          ? 'Access denied. This console is restricted to Administrators only.'
          : 'Access denied. This terminal is restricted to Operations Staff only.',
        403,
        'ROLE_MISMATCH'
      );
    }

    // 5. Generate secure 64-character random session token (32 bytes hex-encoded)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day validity

    // 6. Save session in database for stateful tracking and instant revocation
    await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 7. Record login event in immutable audit log
    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    // 8. Omit passwordHash before returning user data to client
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

  /**
   * LOGOUT WORKFLOW
   * 
   * Deletes the session row from PostgreSQL. Even if the browser retains the cookie,
   * any subsequent request will fail because the session ID no longer exists in DB.
   */
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

  /**
   * CHANGE PASSWORD WORKFLOW
   * 
   * Security Invariants:
   * - Minimum 8 characters.
   * - Must verify current password before allowing change.
   * - Hashes new password with 10 salt rounds of Bcrypt.
   */
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

    // Verify current password first
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_PASSWORD');
    }

    // Hash new password before saving to database
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

  /**
   * GET CURRENT USER: Fetch profile for the active session
   */
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
