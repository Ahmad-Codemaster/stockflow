import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Express middleware generator that validates request body against a Zod schema.
 * Replaces req.body with the sanitized/parsed result.
 * Passes ZodError directly to next() for centralized formatting in errorHandler.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Express middleware generator that validates request query parameters against a Zod schema.
 * In Express 5, req.query is defined on IncomingMessage prototype with only a getter.
 * Object.defineProperty is used to define an own property safely.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Express middleware generator that validates request URL route params against a Zod schema.
 * Object.defineProperty ensures safe assignment across all Express / HTTP engine versions.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      Object.defineProperty(req, 'params', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
}
