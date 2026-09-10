import type { NextFunction, Request, Response } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;

    if (process.env.NODE_ENV !== 'test') {
      const logEntry = {
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        time: new Date().toISOString(),
        reqId: req.id || null,
        method,
        url: originalUrl,
        status,
        durationMs,
        ip: req.ip || req.socket.remoteAddress || null,
      };

      if (process.env.NODE_ENV === 'production') {
        // Output pure JSON for cloud log aggregators (Datadog, CloudWatch, Render)
        console.log(JSON.stringify(logEntry));
      } else {
        // Human-readable dev output with correlation ID
        const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
        console.log(`[${logEntry.time}] [${logEntry.reqId?.slice(0, 8) || 'no-id'}] ${method} ${originalUrl} ${color}${status}\x1b[0m ${durationMs}ms`);
      }
    }
  });

  next();
}
