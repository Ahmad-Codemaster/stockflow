# StockFlow — Operational Production Runbook

> **Target System:** StockFlow (Inventory & Operations Management System)  
> **Audience:** DevOps Engineers, Backend Engineers, System Administrators  
> **Status:** PRODUCTION READY  

---

## 1. System Architecture & Topology

StockFlow is a production full-stack inventory management system consisting of:
* **Frontend:** React 19 SPA served via Vite / Express static asset middleware.
* **Backend:** Node.js Express service with TypeScript.
* **ORM & Database:** Prisma ORM connected to PostgreSQL 16+.
* **Concurrency Engine:** Database-level pessimistic row-level locking (`SELECT ... FOR UPDATE`) inside atomic ACID transactions.
* **Resilience Layer:** In-flight idempotency replay caching (`Idempotency-Key` header) and Zod schema validation.

```
[Clients / Reverse Proxy]
       │ (HTTP requests with optional Idempotency-Key & X-Request-Id)
[Express Application Pipeline]
       ├── Helmet (Security Headers)
       ├── CORS & CookieParser
       ├── RequestId & Structured Logger
       ├── Idempotency Middleware (24h TTL store)
       ├── Route Handlers & Zod Validation Middleware
       │
[Service & Transaction Layer]
       ├── SELECT ... FOR UPDATE (Row-Level Locking)
       ├── Domain Invariant Checks (Non-Negative Stock)
       └── Atomic Audit & Ledger Writing
       │
[PostgreSQL Database]
       ├── CHECK ("quantity" >= 0) Invariant Constraint
       ├── Tables: users, sessions, products, categories, suppliers, stock_transactions, audit_logs
       └── _prisma_migrations History
```

---

## 2. Configuration & Environment Variables

| Variable | Required? | Default | Description |
|---|:---:|---|---|
| `DATABASE_URL` | **YES** | *None* | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname?sslmode=require`) |
| `NODE_ENV` | No | `production` | Set to `production` in live staging/prod environments |
| `PORT` | No | `3001` | Server HTTP port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed origin for frontend SPA |

> [!CAUTION]
> Never commit real database credentials or secrets to version control. Pass credentials into the Docker container or cloud platform (Render, AWS, GCP) using encrypted runtime secrets.

---

## 3. Database Deployment & Migration Runbook

StockFlow uses standard Prisma Migrations (`prisma/migrations/`).

### 3.1 First-Time Migration Deployment (New Database)
When spinning up a brand-new staging or production database:
```bash
# 1. Apply all pending migrations sequentially from scratch
npx prisma migrate deploy

# 2. (Explicit Seeding) Seed initial bootstrap admin account & demo catalog
npm run db:seed
```

> [!IMPORTANT]
> Database seeding is decoupled from application container boot. Normal application startup executes `npx prisma migrate deploy && npm start` without triggering seed execution.

### 3.2 Baselining an Existing Database
If connecting to an existing database previously pushed via `prisma db push`:
```bash
# Mark the baseline 0_init migration as applied without executing DDL
npx prisma migrate resolve --applied 0_init

# Apply subsequent migrations (e.g. stock CHECK constraint)
npx prisma migrate deploy
```

### 3.3 Verifying Migration Status
```bash
npx prisma migrate status
```

---

## 4. Cloud Deployment & Container Workflows

### 4.1 Render Blueprint Deployment (`render.yaml`)
StockFlow is configured for automated Infrastructure-as-Code deployment on Render via `render.yaml`:
* **Web Service:** Node.js runtime executing `npm install && npx prisma generate && npm run build` on build, and `npx prisma migrate deploy && npm start` on boot.
* **Database:** Managed PostgreSQL instance (`stockflow-postgres`) linked automatically via `fromDatabase: connectionString`.
* **Zero Secrets in Code:** Environment variables are dynamically linked within Render.

### 4.2 Docker Deployment Workflow

#### Build Production Image
```bash
docker build -t stockflow:latest .
```

#### Run Container with Runtime Secrets
```bash
docker run -d \
  --name stockflow \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DATABASE_URL="postgresql://user:password@pg-host:5432/stockflow?sslmode=require" \
  -e CORS_ORIGIN="https://stockflow.example.com" \
  --restart unless-stopped \
  stockflow:latest
```

The container automatically runs `npx prisma migrate deploy` on startup before launching the application server. Seeding is not executed on container boot; run `docker exec -it stockflow npm run db:seed` when seeding is explicitly needed.

### 4.3 Credential Rotation Runbook
If production database credentials or environment variables are compromised:
1. **Rotate Database Password:** Regenerate the database user password in the hosting provider dashboard (Render, AWS RDS, Neon).
2. **Update Application Environment Variables:** Update `DATABASE_URL` in the hosting environment settings.
3. **Restart Service:** Trigger a zero-downtime rolling restart of the application container.
4. **Never Commit Credentials:** Verify with `git log -S` that secrets are not committed to source repositories.

---

## 5. Health Checks & Observability

### 5.1 Deep Health Check Endpoint
* **URL:** `GET /api/health`
* **Purpose:** Probes live PostgreSQL connectivity, measures database query latency, and reports memory utilization and uptime.
* **Success Response (HTTP 200):**
```json
{
  "status": "healthy",
  "service": "stockflow-api",
  "timestamp": "2026-09-10T03:10:00.000Z",
  "uptimeSeconds": 1420,
  "database": {
    "status": "connected",
    "latencyMs": 4
  },
  "memory": {
    "rssMb": 85,
    "heapUsedMb": 42
  }
}
```
* **Degraded Response (HTTP 503):**
Returned if database ping fails. Configure load balancers / container orchestrators to flag instances as unhealthy on 503.

### 5.2 Structured JSON Logging
In `production` mode, the server emits single-line JSON log events to stdout:
```json
{"level":"info","time":"2026-09-10T03:10:00.123Z","reqId":"d1af6f75-540a...","method":"POST","url":"/api/inventory/stock-out","status":200,"durationMs":18,"ip":"::ffff:10.0.0.1"}
```
All logs include `reqId` for distributed trace correlation across audit logs and reverse proxy access logs.

---

## 6. Concurrency & Idempotency Rules

### 6.1 Row-Level Locking
All inventory transactions (`/stock-in`, `/stock-out`, `/adjust`) execute inside an atomic database transaction holding an exclusive row lock (`SELECT ... FOR UPDATE`) on the target product row:
* Prevents lost updates under high concurrency.
* Blocks concurrent requests on the *same* product until the transaction commits or rolls back.
* Operations on *different* products execute in parallel with zero contention.

### 6.2 Idempotency Header
Clients making inventory deductions or restocks should supply the `Idempotency-Key` HTTP header:
```http
POST /api/inventory/stock-out HTTP/1.1
Idempotency-Key: c98d3e91-729d-47a3-a2eb-b2f5d5b78d21
Content-Type: application/json

{
  "productId": "p1",
  "quantity": 5
}
```
* If a network timeout occurs and the client retries with the same key, the server returns the cached transaction response with `X-Idempotent-Replay: true` and will **never** deduct stock twice.
* Concurrent in-flight duplicate requests return `HTTP 409 Conflict`.

---

## 7. Incident Response & Troubleshooting

### Scenario A: Database Connection Exhaustion (HTTP 503)
1. Check `/api/health` status and `dbLatencyMs`.
2. Inspect connection pool size in `DATABASE_URL` (default pool size = 10 per Node instance).
3. If necessary, append `?connection_limit=20` to `DATABASE_URL` or scale PostgreSQL connection pooler (e.g. PgBouncer).

### Scenario B: Negative Stock Prevention Triggered (HTTP 400 `INSUFFICIENT_STOCK`)
* Expected behavior when available stock is less than requested withdrawal.
* Zero mutations occur; inspect client requested quantity vs database inventory level.
* If physical inventory disagrees with database count, perform an authorized count reconciliation via `POST /api/inventory/adjust`.

### Scenario C: Emergency Store Reset (Admin Only)
* **Endpoint:** `POST /api/system/wipe`
* **Authentication:** Requires `ADMIN` role with active session cookie.
* Clears all products, categories, suppliers, stock transactions, and movement audit logs while preserving administrator accounts and active user sessions.
