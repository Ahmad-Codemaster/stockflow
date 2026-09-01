# StockFlow — Deployment & DevOps Specification

> **Document Version:** 1.0.0  
> **Status:** AUDITED & DEPLOYMENT GUIDE  
> **Target Platforms:** Vercel / Netlify / Render / Docker / Railway / Fly.io  

---

## 1. Current Deployment Status

* **Build Command:** `vite build` $\rightarrow$ Outputs static bundle to `dist/`.
* **Runtime Behavior:** The built client bundle can be served statically (e.g. via Nginx or Vercel), but because it lacks a backend, all state operations run in-memory and reset whenever a user refreshes or switches browsers.
* **Production Readiness:** **NOT READY for production operations until backend persistence, database, and authentication are connected.**

---

## 2. Target Production Architecture

We recommend a simple, cost-effective, and highly reliable deployment topology:

```
┌────────────────────────────────────────────────────────┐
│               OPTION A: UNIFIED DOCKER CONTAINER        │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Vite Static Assets  │   │  Node.js API Server  │  │
│  │   (Served by Server)  │   │  (Port 8080)         │  │
│  └───────────────────────┘   └──────────┬───────────┘  │
│                                         │              │
└─────────────────────────────────────────┼──────────────┘
                                          │ Database Connection
                                          ▼
                               ┌──────────────────────┐
                               │  Managed PostgreSQL  │
                               │  (Neon / Supabase)   │
                               └──────────────────────┘
```

Or **Option B (Decoupled):**
* **Frontend SPA:** Vercel / Netlify (Global CDN).
* **Backend API:** Render / Railway / Fly.io / AWS ECS.
* **Database:** Managed Serverless PostgreSQL (Neon / Supabase).

---

## 3. Environment Variables Configuration

| Variable Name | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Node execution environment |
| `PORT` | Yes | `8080` | Backend listening port |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/stockflow?sslmode=require` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | `min_32_chars_random_cryptographic_secret` | Secret for signing session cookies |
| `CORS_ORIGIN` | Yes | `https://stockflow.yourdomain.com` | Allowed frontend origin |
| `ADMIN_DEFAULT_EMAIL` | Optional | `admin@stockflow.com` | Initial admin account email for first boot |
| `ADMIN_DEFAULT_PASSWORD` | Optional | `InitialAdminSecretPass123!` | Initial admin account password for seed |

---

## 4. Production Multi-Stage `Dockerfile`

```dockerfile
# Multi-stage Dockerfile for Unified StockFlow Deployment
# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Production Server Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

# Copy built frontend assets to serve
COPY --from=frontend-builder /app/dist ./dist
# Copy backend source
COPY server ./server

EXPOSE 8080
USER node
CMD ["node", "server/index.js"]
```

---

## 5. Automated CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: StockFlow CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install pnpm
        run: corepack enable

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint Code
        run: pnpm run format --check || npx eslint .

      - name: TypeScript Type Check
        run: npx tsc --noEmit

      - name: Run Automated Tests
        run: pnpm test

      - name: Build Production Assets
        run: pnpm run build
```

---

## 6. Pre-Flight Deployment Checklist

- [ ] `.env` file populated with secure, random `JWT_SECRET` ($\ge 32$ chars).
- [ ] Managed PostgreSQL database provisioned and accepting SSL connections.
- [ ] Database migration script executed (`pnpm prisma migrate deploy` or direct SQL DDL).
- [ ] Initial Admin user seeded with strong, hashed password.
- [ ] HTTPS / SSL certificate configured and active.
- [ ] CORS policies verified to restrict unauthorized domains.
- [ ] Security headers active (Content-Security-Policy, HSTS, X-Content-Type-Options, X-Frame-Options).
- [ ] Automated health-check endpoint (`GET /api/health`) responding `200 OK`.
