import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

/**
 * Enterprise Rate Limiting Middleware
 * Protects sensitive endpoints (like /api/auth/login) from automated brute force attacks.
 */
export function rateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 20, // 20 attempts per window per IP
  message = 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
}: {
  windowMs?: number;
  max?: number;
  message?: string;
} = {}) {
  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipBuckets.entries()) {
      if (now > record.resetTime) {
        ipBuckets.delete(ip);
      }
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // In test environment, skip rate limiting
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = ipBuckets.get(ip);

    if (!record || now > record.resetTime) {
      ipBuckets.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return next(new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds }));
    }

    next();
  };
}
