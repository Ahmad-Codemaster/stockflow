/**
 * ============================================================================
 * DATABASE CLIENT SINGLETON (Prisma ORM)
 * ============================================================================
 * What this module does:
 * - Initializes and exports a single, shared instance of PrismaClient.
 * - Manages the connection pool to our PostgreSQL database.
 * 
 * Why the global singleton pattern is used:
 * - In development environments, hot-reloading (Vite / tsx watch) can re-evaluate
 *   this file multiple times, which would create multiple Prisma instances and
 *   exhaust PostgreSQL connection limits.
 * - By attaching `prisma` to the Node.js `global` object in non-production,
 *   we ensure that only ONE connection pool exists across file reloads.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables from .env file (DATABASE_URL, PORT, etc.)
dotenv.config();

// Declare global type so TypeScript recognizes `global.prisma` without errors
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Reuse existing instance from global if available; otherwise create new PrismaClient
export const prisma = global.prisma || new PrismaClient({
  // In development, log warnings and errors to help debug slow or failing queries
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Cache instance on global object during development to prevent pool exhaustion on reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

