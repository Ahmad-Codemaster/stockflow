import type { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${method} ${originalUrl} ${status} - ${duration}ms`);
    }
  });

  next();
}
