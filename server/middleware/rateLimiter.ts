/**
 * ============================================================================
 * RATE LIMITING MIDDLEWARE (`rateLimiter`)
 * ============================================================================
 * What this module does:
 * - Protects sensitive authentication endpoints against brute-force credential stuffing.
 * - Tracks request counts per client IP address within a configurable time window.
 * - Returns HTTP 429 Too Many Requests and attaches standard `Retry-After` response headers.
 * 
 * Trade-off to mention in interviews:
 * - This uses an in-memory `Map` with automatic interval garbage collection.
 * - In a horizontally scaled cluster, rate limits would be tracked in a shared Redis cache.
 */

import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window store mapping IP address -> { count, resetTime }
const ipBuckets = new Map<string, RateLimitRecord>();

/**
 * Enterprise Rate Limiting Middleware
 * Protects sensitive endpoints (like /api/auth/login) from automated brute force attacks.
 */
export function rateLimiter({
  windowMs = 15 * 60 * 1000, // 15-minute sliding window
  max = 20, // Maximum 20 attempts per window per IP
  message = 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
}: {
  windowMs?: number;
  max?: number;
  message?: string;
} = {}) {
  // Periodic cleanup of expired entries (unref() prevents timer from blocking process exit)
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

/**
 * Mutation Rate Limiter: 60 requests per minute per IP.
 * Applied to high-impact inventory mutation routes (stock-in, stock-out, adjust).
 * Protects against scripted bulk manipulation attacks.
 */
export const mutationLimiter = rateLimiter({
  windowMs: 60 * 1000,       // 1-minute window
  max: 60,
  message: 'Too many inventory requests from this IP. Please slow down and retry in 1 minute.',
});

/**
 * Strict Rate Limiter: 20 requests per 10 minutes per IP.
 * Applied to the system wipe endpoint to prevent automated malicious abuse while allowing admins to manage data.
 */
export const strictLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000,  // 10-minute window
  max: 20,
  message: 'Too many system operation requests. Please wait a few minutes before retrying.',
});
