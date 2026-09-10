import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

// Extend Express Request interface to include request ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Request ID Middleware:
 * - Reads incoming `X-Request-Id` header (from reverse proxy / API gateway) or generates a unique UUID v4.
 * - Attaches `req.id` to the request context for correlation across logs and audit events.
 * - Echoes `X-Request-Id` in response headers for client-side tracing.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}
