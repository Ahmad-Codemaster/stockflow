/**
 * ============================================================================
 * STRUCTURED LOGGER SINGLETON (`server/logger.ts`)
 * ============================================================================
 * What this module does:
 * - Provides a lightweight, consistent logger API (`logger.info`, `.warn`, `.error`, `.debug`).
 * - In production: emits single-line JSON events for cloud log aggregators (Datadog, CloudWatch, Render).
 * - In development: emits human-readable colorized output.
 * - In test: suppresses all output to prevent noise in test runner.
 *
 * Why not Pino?
 * - pnpm audit shows no high-severity dependency issues.
 * - This zero-dependency wrapper provides the same JSON contract without adding a production dependency.
 *   If Pino is desired later, swap the implementation here — all callers remain unchanged.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const env = process.env.NODE_ENV ?? 'development';
const isTest = env === 'test';
const isProduction = env === 'production';

// Color codes for development output
const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',   // Cyan
  info:  '\x1b[32m',   // Green
  warn:  '\x1b[33m',   // Yellow
  error: '\x1b[31m',   // Red
};
const RESET = '\x1b[0m';

function formatDev(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const color = COLORS[level];
  const prefix = `[${ts}] ${color}${level.toUpperCase()}${RESET}`;
  const ctx = context ? ' ' + JSON.stringify(context) : '';
  return `${prefix} ${message}${ctx}`;
}

function formatProd(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  return JSON.stringify({
    level,
    time: new Date().toISOString(),
    msg: message,
    ...context,
  });
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (isTest) return; // Suppress all output during automated tests

  const formatted = isProduction
    ? formatProd(level, message, context)
    : formatDev(level, message, context);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info:  (message: string, context?: Record<string, unknown>) => log('info',  message, context),
  warn:  (message: string, context?: Record<string, unknown>) => log('warn',  message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
};

export default logger;
