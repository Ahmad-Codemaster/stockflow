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
* **Rate limited to 3 requests per 10 minutes per IP.** If you trigger the limit by accident, wait 10 minutes.

---

## 8. Backup & Restore

### 8.1 Creating a Backup

Use `pg_dump` to create a compressed PostgreSQL dump. The custom format (`-Fc`) is parallel-restore capable and supports selective table restoration.

```bash
# Render / self-hosted: get the DATABASE_URL from your environment dashboard
pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-acl \
  --no-owner \
  --file="stockflow_$(date +%Y%m%d_%H%M%S).dump"
```

**Recommended Backup Retention Policy:**
| Frequency | Retention |
|-----------|-----------|
| Hourly | 24 hours |
| Daily | 30 days |
| Weekly | 12 weeks |
| Monthly | 12 months |

> [!IMPORTANT]
> Render managed PostgreSQL includes automated daily backups on paid plans. Verify your backup window in the Render dashboard under **PostgreSQL → Backups**.

### 8.2 Verifying a Backup

Always verify that a backup is restorable in a staging environment before trusting it:

```bash
# Create a fresh test database
createdb stockflow_restore_test

# Restore the dump
pg_restore \
  --dbname="postgresql://postgres:password@localhost:5432/stockflow_restore_test" \
  --no-acl \
  --no-owner \
  --verbose \
  stockflow_20240101_000000.dump

# Sanity check: count rows in core tables
psql "postgresql://postgres:password@localhost:5432/stockflow_restore_test" \
  -c "SELECT COUNT(*) FROM products; SELECT COUNT(*) FROM stock_transactions; SELECT COUNT(*) FROM users;"

# Clean up after verification
dropdb stockflow_restore_test
```

### 8.3 Restoring to Production

> [!CAUTION]
> Production restore is a destructive operation that overwrites all existing data. Perform during a maintenance window with all users logged out.

```bash
# 1. Notify users and drain traffic (disable load balancer routing)

# 2. Restore with --clean to drop existing objects before recreating
pg_restore \
  --dbname="$PRODUCTION_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-acl \
  --no-owner \
  --single-transaction \
  --verbose \
  stockflow_20240101_000000.dump

# 3. Verify restore succeeded
psql "$PRODUCTION_DATABASE_URL" -c "SELECT COUNT(*) FROM products;"

# 4. Re-enable load balancer routing
```

---

## 9. Application Rollback

### 9.1 Docker Image Rollback

```bash
# Tag the current running image before deploying a new version
docker tag stockflow:latest stockflow:stable-$(date +%Y%m%d)

# If the new deployment is faulty, roll back to the previous stable image
docker stop stockflow-container
docker run -d \
  --name stockflow-container \
  --env-file .env.production \
  -p 3001:3001 \
  stockflow:stable-20240101
```

### 9.2 Render Deployment Rollback

Render keeps previous successful deployments and allows one-click rollback:

1. Navigate to **Render Dashboard → StockFlow Service → Deployments**.
2. Find the last successful green deployment.
3. Click **Re-deploy** on that deployment to roll back instantly.

### 9.3 Database Migration Rollback

Prisma does not auto-generate rollback migrations. For each migration, a manual rollback SQL must be prepared.

**Process:**
```bash
# 1. Identify the migration to roll back
npx prisma migrate status

# 2. Apply the manual rollback SQL (stored in prisma/migrations/<name>/rollback.sql if prepared)
psql "$DATABASE_URL" -f prisma/migrations/20240101_add_feature/rollback.sql

# 3. Mark the migration as rolled back in Prisma's tracking table
psql "$DATABASE_URL" -c "DELETE FROM _prisma_migrations WHERE migration_name = '20240101_add_feature';"

# 4. Verify the schema matches the previous state
npx prisma db pull  # Re-introspects from live DB
```

> [!WARNING]
> Always test rollback SQL in a staging database before applying to production. Never delete data that may be needed for audit trail continuity.

---

## 10. Extended Troubleshooting

### Scenario D: Idempotency Key Conflict (HTTP 409 `IDEMPOTENCY_CONFLICT`)

**Symptom:** Client sends the same `Idempotency-Key` header before the first request completes.

**Cause:** Two parallel client requests with identical idempotency keys arrived simultaneously.

**Resolution:**
1. The retry must wait 1–3 seconds for the first request to complete.
2. On completion, the second request will receive a replayed response from the in-memory idempotency store.
3. If the first request failed with a 5xx server error, the key is automatically removed from the store, allowing a clean retry.

**Check:** In the API response, look for `X-Idempotent-Replay: true` header — this confirms a cached replay was served.

---

### Scenario E: Connection Pool Exhaustion with PgBouncer

**Symptom:** API returns `HTTP 503` with DB latency > 5000ms. Health check at `/api/health/ready` shows `disconnected`.

**Diagnosis:**
```bash
# Check active connections vs max
psql "$DATABASE_URL" -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check pool settings in DATABASE_URL connection string
echo "$DATABASE_URL" | grep -o 'connection_limit=[0-9]*'
```

**Resolution:**
```bash
# Option 1: Increase pool size in DATABASE_URL
export DATABASE_URL="postgresql://...?connection_limit=25&pool_timeout=10"

# Option 2: Configure PgBouncer in front of PostgreSQL
# pgbouncer.ini:
# pool_mode = transaction
# max_client_conn = 200
# default_pool_size = 20
```

---

### Scenario F: Container Out of Memory (OOM Kill)

**Symptom:** Container crashes with exit code 137 (SIGKILL). `/api/health/live` stops responding.

**Diagnosis:**
```bash
# Check memory usage from live health endpoint (if still responsive)
curl -s "$API_URL/api/health/ready" | jq '.memory'

# Docker: inspect OOM events
docker inspect stockflow-container | jq '.[0].State'
docker events --filter "event=oom" --filter "container=stockflow-container"
```

**Resolution:**
1. Increase the container memory limit in Docker Compose or Render service settings.
2. Look for memory leaks in the idempotency store (24h TTL, cleared every hour via `.unref()` interval).
3. Check for `SET client_min_messages = DEBUG` queries left in development code that inflate response payloads.

---

### Scenario G: Rate Limit False Positives (HTTP 429)

**Symptom:** Legitimate API clients receive `RATE_LIMIT_EXCEEDED` on inventory mutations.

**Context:** `mutationLimiter` allows 60 requests/minute per IP. `strictLimiter` allows 3 requests/10 minutes on `/wipe`.

**Workaround (development):**
- Set `NODE_ENV=test` to skip all rate limiting.

**Production fix:**
- Increase `max` threshold in `mutationLimiter` if legitimate throughput exceeds 60/min.
- Deploy multiple server instances behind a shared Redis rate-limit store to distribute per-IP counters across nodes.
