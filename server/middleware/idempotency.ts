import type { NextFunction, Request, Response } from 'express';

interface IdempotentRecord {
  status: 'PENDING' | 'COMPLETED';
  statusCode?: number;
  body?: any;
  createdAt: number;
}

// In-memory idempotency cache with 24-hour TTL
const idempotencyStore = new Map<string, IdempotentRecord>();
const TTL_MS = 24 * 60 * 60 * 1000;

// Periodic cleanup of expired entries (every 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.createdAt > TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

/**
 * Idempotency Middleware for non-idempotent mutation operations (POST/PUT/PATCH).
 * 
 * Inspects `Idempotency-Key` or `X-Idempotency-Key` header.
 * - If not present: passes through normally.
 * - If present and already completed: replays previous response directly with HTTP 200/cached status.
 * - If present and currently in-flight: returns 409 Conflict.
 * - If present and new: executes handler, captures response body, and saves for replay.
 */
export function idempotency() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to state-modifying HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const key = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;
    if (!key || typeof key !== 'string' || !key.trim()) {
      return next();
    }

    const normalizedKey = `${req.method}:${req.baseUrl || ''}${req.path}:${key.trim()}`;
    const existing = idempotencyStore.get(normalizedKey);

    if (existing) {
      // Check for expiration
      if (Date.now() - existing.createdAt > TTL_MS) {
        idempotencyStore.delete(normalizedKey);
      } else if (existing.status === 'PENDING') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'A request with this idempotency key is currently being processed. Please retry shortly.',
          },
        });
      } else if (existing.status === 'COMPLETED' && existing.body) {
        res.setHeader('X-Idempotent-Replay', 'true');
        return res.status(existing.statusCode || 200).json(existing.body);
      }
    }

    // Mark as pending
    idempotencyStore.set(normalizedKey, {
      status: 'PENDING',
      createdAt: Date.now(),
    });

    // Intercept res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      // Only cache successful or non-server-error responses
      if (res.statusCode >= 200 && res.statusCode < 500) {
        idempotencyStore.set(normalizedKey, {
          status: 'COMPLETED',
          statusCode: res.statusCode,
          body,
          createdAt: Date.now(),
        });
      } else {
        // Remove failed transaction keys so client can fix error and retry
        idempotencyStore.delete(normalizedKey);
      }
      return originalJson(body);
    };

    next();
  };
}
