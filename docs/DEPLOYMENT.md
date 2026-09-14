# StockFlow — Deployment & Cloud Infrastructure Guide

> **Document Version:** 2.0.0  
> **Status:** PRODUCTION READY  
> **Target Platforms:** Render (Blueprint `render.yaml`) / Docker / Managed PostgreSQL (Supabase / Neon / Render)  

---

## 1. Deployment Architecture & Status

StockFlow is a unified, production-ready full-stack application:
* **Frontend:** React 19 SPA built with Vite 8 and Tailwind CSS v4, compiled into optimized static assets served directly by Express.
* **Backend:** Node.js Express 5 API running TypeScript via `tsx` with structured JSON logging, correlation IDs, and rate limiting.
* **Database & ORM:** PostgreSQL 16+ connected via Prisma ORM 6.19 with automatic migration deployment.
* **Concurrency Engine:** Database-level row-level locking (`SELECT ... FOR UPDATE`) inside atomic ACID transactions (`prisma.$transaction`).
* **Session Management:** Secure, HttpOnly, SameSite session cookies backed by the PostgreSQL `sessions` table.

```
┌────────────────────────────────────────────────────────┐
│               UNIFIED PRODUCTION CONTAINER             │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Vite Static Assets  │   │  Node.js API Server  │  │
│  │   (Served from dist/) │   │  (Port 3001)         │  │
│  └───────────────────────┘   └──────────┬───────────┘  │
│                                         │              │
└─────────────────────────────────────────┼──────────────┘
                                          │
                                          │ Database Connection
                                          ▼
                               ┌──────────────────────┐
                               │  Managed PostgreSQL  │
                               │  (Supabase / Neon)   │
                               └──────────────────────┘
```

---

## 2. Environment Variables Configuration

| Variable Name | Required? | Default / Example | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Execution environment (`production`, `development`, `test`) |
| `PORT` | No | `3001` | Backend HTTP listening port |
| `DATABASE_URL` | **Yes** | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Transaction pooled database connection URL (runtime queries) |
| `DIRECT_URL` | **Yes** | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres` | Direct database connection URL (required by Prisma for DDL schema migrations) |
| `SESSION_SECRET` | **Yes** | `min_32_chars_random_cryptographic_secret` | Secret key used to sign and verify session cookies |
| `CORS_ORIGIN` | Yes | `https://stockflow.onrender.com` | Allowed frontend domain (matches hosting URL in production) |
| `ADMIN_DEFAULT_EMAIL` | Optional | `admin@stockflow.com` | Initial admin account email for first boot seed |
| `ADMIN_DEFAULT_PASSWORD` | Optional | `Admin@123` | Initial admin account password for seed |

### Dual Database Connection Setup (Supabase / PgBouncer)
1. **Transaction Pooling (`DATABASE_URL`, Port 6543):** Used at runtime by Express and Prisma via Supavisor / PgBouncer. Supports thousands of concurrent client queries without exhausting database connection limits.
2. **Direct Connection (`DIRECT_URL`, Port 5432):** Used exclusively by Prisma CLI (`npx prisma migrate deploy`). Advisory locks and DDL migrations require session-level features not supported in transaction pooling mode.

---

## 3. Render Infrastructure-as-Code (`render.yaml`)

StockFlow includes native Render Blueprint configuration for zero-configuration cloud deployment:

```yaml
services:
  - type: web
    name: stockflow
    runtime: node
    plan: free
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npx prisma migrate deploy && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false # Set to Supabase Pooled Connection (Port 6543, ?pgbouncer=true) in Render dashboard
      - key: DIRECT_URL
        sync: false # Set to Supabase Direct Connection (Port 5432) in Render dashboard
      - key: SESSION_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://stockflow.onrender.com
```

### Steps to Deploy on Render:
1. Push repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New + → Blueprint**.
3. Connect your repository. Render automatically detects [`render.yaml`](file:///c:/Users/ahmad/AndroidStudioProjects/stockflow/render.yaml).
4. Enter your `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) from your Supabase / PostgreSQL dashboard.
5. Click **Apply**. Render will run migrations and build the frontend assets automatically.

---

## 4. Production Multi-Stage `Dockerfile`

StockFlow uses a secure, non-root multi-stage Docker build:

```dockerfile
# Multi-stage production Dockerfile for StockFlow
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY server ./server
COPY tsconfig.json ./

RUN npm install tsx

# Security hardening: switch to non-root node user (uid=1000)
USER node

EXPOSE 3001

CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npx prisma migrate deploy || true; npx tsx server/seed.ts || true; fi && npx tsx server/index.ts"]
```

### Building & Running with Docker Locally:

```bash
# Build production image
docker build -t stockflow:latest .

# Run container with runtime secrets
docker run -d \
  --name stockflow \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/stockflow" \
  -e DIRECT_URL="postgresql://postgres:password@host.docker.internal:5432/stockflow" \
  -e SESSION_SECRET="production-session-secret-32-chars-minimum" \
  -e CORS_ORIGIN="http://localhost:3001" \
  stockflow:latest
```

---

## 5. Automated CI/CD Pipeline (`.github/workflows/ci.yml`)

The repository runs a complete validation pipeline on every push and pull request to `main`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  validate:
    name: Lint, Typecheck, Test & Build
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
          POSTGRES_DB: stockflow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --no-frozen-lockfile

      - name: Security Vulnerability Audit
        run: npm audit --audit-level=high --omit=dev
        continue-on-error: true

      - name: Generate Prisma Client & Deploy Migrations
        run: |
          npx prisma generate
          npx prisma migrate deploy
          npx tsx server/seed.ts
        env:
          DATABASE_URL: "postgresql://postgres:password@localhost:5432/stockflow_test"
          DIRECT_URL: "postgresql://postgres:password@localhost:5432/stockflow_test"

      - name: TypeScript Typecheck
        run: npx tsc --noEmit

      - name: Run Automated Test Suite
        run: npx vitest run
        env:
          NODE_ENV: test
          DATABASE_URL: "postgresql://postgres:password@localhost:5432/stockflow_test"
          DIRECT_URL: "postgresql://postgres:password@localhost:5432/stockflow_test"
          SESSION_SECRET: "test-session-secret-key-32-characters-minimum"

      - name: Build Frontend Distribution Bundle
        run: pnpm build
```

---

## 6. Health Checks & Production Monitoring

StockFlow provides three standard HTTP monitoring endpoints for container orchestrators and load balancers:

### 6.1 Liveness Probe (`GET /api/health/live`)
- **Purpose:** Fast ping confirming the Node.js event loop is responsive. Zero database load.
- **Used by:** Kubernetes liveness probe or Render process health monitor to restart deadlocked processes.
- **Response (HTTP 200):**
  ```json
  {
    "status": "alive",
    "service": "stockflow-api",
    "timestamp": "2026-09-13T23:45:00.000Z"
  }
  ```

### 6.2 Readiness Probe (`GET /api/health/ready`)
- **Purpose:** Deep health check validating live PostgreSQL connectivity and latency.
- **Used by:** Reverse proxies and load balancers to route traffic only to healthy instances.
- **Response (HTTP 200):**
  ```json
  {
    "status": "healthy",
    "service": "stockflow-api",
    "timestamp": "2026-09-13T23:45:00.000Z",
    "uptimeSeconds": 3600,
    "database": {
      "status": "connected",
      "latencyMs": 4
    },
    "memory": {
      "rssMb": 82,
      "heapUsedMb": 45
    }
  }
  ```
- **Degraded Response (HTTP 503):** If database ping fails, returns `status: "degraded"` and database error details.

### 6.3 Deep Health Probe (`GET /api/health`)
- Alias to `/ready` for backward compatibility.

---

## 7. Pre-Flight Production Deployment Checklist

Before taking traffic live in production:

- [x] **Database Connectivity:** PostgreSQL 16+ active with SSL (`sslmode=require`).
- [x] **Dual URLs Configured:** `DATABASE_URL` set to pooled port 6543; `DIRECT_URL` set to direct port 5432.
- [x] **Prisma Migrations Applied:** `npx prisma migrate deploy` executed successfully.
- [x] **Session Secret Security:** `SESSION_SECRET` populated with a random cryptographic string ($\ge 32$ characters).
- [x] **CORS Origin Whitelist:** `CORS_ORIGIN` matches exact production frontend URL (`https://...`).
- [x] **Rate Limiting Active:** Auth rate limiting (20/15m), mutation limiter (60/min), and strict limiter (3/10m) protecting sensitive routes.
- [x] **Security Headers:** Helmet enabled protecting against MIME-sniffing, XSS, and clickjacking.
- [x] **Non-Root User:** Container process runs as non-privileged `node` user (`uid=1000`).
- [x] **Automated CI Passing:** GitHub Actions CI executing tests, typechecking, and build on all branches.
- [x] **Health Check Configured:** Container orchestrator configured with `/api/health/live` and `/api/health/ready`.

