/**
 * ============================================================================
 * EXPRESS APPLICATION FACTORY (`server/app.ts`)
 * ============================================================================
 * What this module does:
 * - Configures the Express HTTP middleware pipeline (Helmet, CORS, CookieParser, BodyParser).
 * - Mounts all modular REST API routers (`/api/auth`, `/api/inventory`, `/api/products`, etc.).
 * - Serves the compiled React SPA distribution bundle in production.
 * - Attaches 404 fallback handling and the centralized Error Handler.
 * 
 * Why the `createApp()` factory function is used:
 * - Allows our automated test suite (Supertest + Vitest) to instantiate the app
 *   in memory without binding to a physical network port (preventing port collisions).
 */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import productRoutes from './routes/productRoutes';
import reportRoutes from './routes/reportRoutes';
import supplierRoutes from './routes/supplierRoutes';
import systemRoutes from './routes/systemRoutes';
import userRoutes from './routes/userRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // 1. Security Headers: Protects against clickjacking, MIME-sniffing, etc.
  app.use(helmet({ contentSecurityPolicy: false }));

  // 2. CORS (Cross-Origin Resource Sharing): Whitelist trusted frontend and allow cookies
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true, // Required to send and receive HttpOnly session cookies
    })
  );

  // 3. Cookie Parsing: Reads incoming `stockflow_session` cookie from request headers
  app.use(cookieParser());

  // 4. JSON Body Parser: Parses incoming JSON request payloads
  app.use(express.json());

  // 5. Audit Request Logger: Logs incoming method, URL, status code, and latency
  app.use(requestLogger);

  // 6. Health Check: Used by cloud container orchestrators (Render / Kubernetes) to verify liveness
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'stockflow-api',
      timestamp: new Date().toISOString(),
    });
  });

  // 7. REST API Route Mounts
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/system', systemRoutes);

  // 8. Production Static Asset Serving: Serves compiled React SPA from dist/
  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback: any non-API route returns index.html for React Router to handle
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 9. 404 Handler for undefined API routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
      },
    });
  });

  // 10. Centralized Error Handler (MUST be the final middleware in the pipeline)
  app.use(errorHandler);

  return app;
}

// Export singleton app for production server and test runners
export const app = createApp();
export default app;
