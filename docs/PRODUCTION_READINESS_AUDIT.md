# StockFlow — Comprehensive Technical Audit & Production-Readiness Strategy

> **Document Type:** Senior Backend Systems Audit & Architectural Strategy  
> **Target System:** StockFlow (Inventory & Operations Management System)  
> **Auditor:** Senior Backend Systems Engineer & Code Auditor  
> **Date:** September 10, 2026  
> **Status:** AUDITED / PRODUCTION-MINDED STRATEGY SPECIFIED  
> **Baseline:** React 19 + TypeScript 5.7 + Express 5 + Prisma 6 (PostgreSQL)  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current Architecture](#2-current-architecture)
3. [Current Request Flow](#3-current-request-flow)
4. [Inventory Concurrency Analysis](#4-inventory-concurrency-analysis)
5. [ACID / Transaction Integrity Analysis](#5-acid--transaction-integrity-analysis)
6. [API Validation Analysis](#6-api-validation-analysis)
7. [Authentication Analysis](#7-authentication-analysis)
8. [Authorization / RBAC Analysis](#8-authorization--rbac-analysis)
9. [Idempotency Analysis](#9-idempotency-analysis)
10. [Audit Logging Analysis](#10-audit-logging-analysis)
11. [Observability Analysis](#11-observability-analysis)
12. [Testing Analysis](#12-testing-analysis)
13. [Database Analysis](#13-database-analysis)
14. [Security Analysis](#14-security-analysis)
15. [Deployment Analysis](#15-deployment-analysis)
16. [Documentation Analysis](#16-documentation-analysis)
17. [Current Strengths](#17-current-strengths)
18. [Critical Risks](#18-critical-risks)
19. [Recommended Changes](#19-recommended-changes)
20. [Priority Matrix](#20-priority-matrix)
21. [Phased Implementation Roadmap](#21-phased-implementation-roadmap)

---

## 1. Executive Summary

A comprehensive technical audit was performed on the **StockFlow** codebase. The repository contains a working full-stack inventory application featuring a React 19 SPA frontend, an Express 5 REST API, and Prisma ORM configured for PostgreSQL.

However, forensic evaluation reveals a **critical divergence** between documented claims in [`README.md`](../README.md) and [`docs/`](../docs/) versus what is actually implemented in executable code.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                AUDIT COMPLIANCE MATRIX                                  │
├────────────────────────┬────────────────────────────────┬───────────────────────────────┤
│ Evaluation Dimension   │ Documented Claim               │ Audited Reality               │
├────────────────────────┼────────────────────────────────┼───────────────────────────────┤
│ Concurrency Control    │ PostgreSQL row-level locks     │ In-memory single-process mutex│
│ Database Invariants    │ quantity >= 0 enforced in DB   │ Missing (App-level check only)│
│ Migrations Strategy    │ Relational schema migrations   │ Missing (Prisma db push only) │
│ Stock Adjustments      │ ACID atomic adjustment API     │ Missing (Endpoint nonexistent)│
│ API Input Validation   │ Comprehensive backend schemas  │ Partial (Query/Params missing)│
│ Authorization / RBAC   │ Granular role enforcement      │ Coarse binary role check only │
│ Idempotency            │ Safe network retries           │ Missing (Duplicate executions)│
│ Audit Logging          │ Forensic audit trail           │ Partial (Non-atomic & lossy)  │
│ Observability          │ Structured metrics & health    │ Unstructured console.log only │
│ Production Security    │ Hardened container & secrets   │ CRITICAL: Hardcoded secrets   │
└────────────────────────┴────────────────────────────────┴───────────────────────────────┘
```

### Executive Verdict
StockFlow is **not currently production-grade**. It is a single-instance MVP prototype. In any horizontally scaled or clustered container deployment, concurrent stock operations will cause race conditions, lost updates, and inventory corruption. The system can be brought to a **"production-minded foundation"** through a targeted, 9-phase engineering refactor prioritizing database correctness over superficial features.

---

## 2. Current Architecture

### 2.1 Component Breakdown & Implementation Status

| Component | Audited Implementation | Classification | Notes & Deficiencies |
| :--- | :--- | :--- | :--- |
| **Frontend Shell** | React 19, Vite 8, Tailwind CSS v4 | **Implemented** | SPA with responsive navigation and UI primitives |
| **Frontend Routing**| `react-router-dom` v7.18.3 | **Implemented** | Declarative browser URL routing in [`src/App.tsx`](../src/App.tsx) |
| **State Management**| Domain Contexts (`Auth`, `Inventory`, `UI`) | **Implemented** | Split contexts in [`src/contexts/`](../src/contexts) adapted via [`src/context.tsx`](../src/context.tsx) |
| **HTTP Framework**  | Express v5.2.1 | **Implemented** | Factory pattern in [`server/app.ts`](../server/app.ts) |
| **Database ORM**    | Prisma Client v6.19.3 | **Implemented** | Configured in [`prisma/schema.prisma`](../prisma/schema.prisma) and [`server/db.ts`](../server/db.ts) |
| **Database Engine** | PostgreSQL (`postgresql` provider) | **Partially Implemented**| Schema declares `postgresql`, but local `.env` declares `file:./dev.db` |
| **Migrations**      | *None* | **Missing** | Zero SQL migration files in `prisma/migrations`; uses `prisma db push` |
| **Authentication**  | Database session tokens via HttpOnly cookies | **Implemented** | 32-byte hex tokens stored in `sessions` table |
| **Authorization**   | Coarse binary RBAC (`ADMIN` vs `STAFF`) | **Implemented** | Enforced via [`server/middleware/rbac.ts`](../server/middleware/rbac.ts) |
| **Rate Limiting**   | In-memory sliding window on `/api/auth/login` | **Partially Implemented**| Process-local `Map`; no coverage on other mutation routes |
| **Input Validation**| Zod schemas inside controller methods | **Partially Implemented**| Request bodies validated; path parameters and query strings unvalidated |
| **Concurrency Lock**| In-memory FIFO Promise queue (`AsyncLock`) | **Partially Implemented**| Works in 1 Node process only; global bottleneck across all products |
| **Observability**   | `console.log` middleware | **Missing** | No structured JSON logging, no request IDs, shallow health check |
| **Containerization**| Multi-stage `Dockerfile` | **Partially Implemented**| Runs `tsx` in production; hardcodes sensitive production secrets |

### 2.2 Layer Boundaries & Separation of Concerns

```
[HTTP Request]
       │
       ▼
[Middleware Pipeline] ──► helmet, cors, cookieParser, express.json, requestLogger
       │
       ▼
[Router Layer] ─────────► Route registration & coarse RBAC (requireAuth, requireRole)
       │
       ▼
[Controller Layer] ─────► Ad-hoc Zod body validation & req/res extraction
       │
       ▼
[Service Layer] ────────► Business invariants & transaction orchestration
       │                  (AsyncLock mutex applied here)
       ▼
[Data Access / ORM] ────► Prisma Client ($transaction, findUnique, update, create)
       │
       ▼
[PostgreSQL Database] ──► Tables (users, sessions, categories, suppliers, products,
                          stock_transactions, audit_logs)
                          *MISSING: CHECK constraints, triggers, and foreign key cascades*
```

**Architecture Violations Identified:**
1. **Validation in Controllers:** Zod schema validation is invoked imperatively inside each controller method (`schema.parse(req.body)`) rather than in declarative, reusable middleware.
2. **Duplicate Business Validation:** Both [`ProductController`](../server/controllers/productController.ts) and [`ProductService`](../server/services/productService.ts) perform redundant manual boundary checks (`price < 0`, `reorderLevel < 0`).
3. **In-Memory Client Filtering in Services:** In [`CategoryService`](../server/services/categoryService.ts#L36-L40), category uniqueness is checked by fetching *all* categories from the database into Node memory (`prisma.category.findMany()`) and running JavaScript `Array.prototype.find()`.
4. **Global Single-Thread Mutex:** An in-memory mutex in [`InventoryService`](../server/services/inventoryService.ts#L47) serializes all stock operations across *all products globally*, introducing an architectural throughput bottleneck.

---

## 3. Current Request Flow

### 3.1 Flow: `POST /api/inventory/stock-in`

```
Client (Browser / API Consumer)
    │  POST /api/inventory/stock-in { productId, quantity, supplierId, reference, notes }
    ▼
[server/app.ts]
    │  Executes helmet, cors, cookieParser, express.json, requestLogger
    ▼
[server/routes/inventoryRoutes.ts]
    │  Executes requireAuth middleware
    │  ├── Extracts 'stockflow_session' cookie or Bearer token
    │  ├── Queries 'sessions' table joined with 'users'
    │  └── Attaches req.user and req.sessionId
    ▼
[server/controllers/inventoryController.ts] -> stockIn()
    │  Calls stockInSchema.parse(req.body)
    │  Extracts ipAddress
    ▼
[server/services/inventoryService.ts] -> stockIn()
    │  1. Manual check: qty <= 0 -> throw AppError(400)
    │  2. Chains execution onto in-memory stockLock.acquire() Promise queue
    │  3. Invokes prisma.$transaction(async (tx) => {
    │         a. tx.product.findUnique({ where: { id } })
    │         b. Check: !product || product.isArchived -> throw AppError(404)
    │         c. newStock = product.quantity + qty
    │         d. tx.product.update({ where: { id }, data: { quantity: newStock } })
    │         e. tx.stockTransaction.create({ type: 'STOCK_IN', ... })
    │         f. returns { product, txn, previousStock, newStock }
    │     })
    │  4. OUTSIDE TRANSACTION: AuditService.log({ action: 'STOCK_IN', ... })
    │     └── If logging fails, catches and swallows error to console
    │  5. Returns calculated stock status: computeStockStatus(newStock, reorderLevel)
    ▼
[server/controllers/inventoryController.ts]
    │  Returns HTTP 200 { success: true, data: result }
```

### 3.2 Flow: `POST /api/inventory/stock-out`

```
Client (Browser / API Consumer)
    │  POST /api/inventory/stock-out { productId, quantity, reference, notes }
    ▼
[server/middleware/auth.ts] -> requireAuth
    │  Validates active session and confirms user.status === 'Active'
    ▼
[server/controllers/inventoryController.ts] -> stockOut()
    │  Calls stockOutSchema.parse(req.body)
    ▼
[server/services/inventoryService.ts] -> stockOut()
    │  1. Chains execution onto in-memory stockLock.acquire()
    │  2. Invokes prisma.$transaction(async (tx) => {
    │         a. tx.product.findUnique({ where: { id } })
    │         b. INVARIANT CHECK: if (product.quantity < qty) -> throw AppError(400, 'INSUFFICIENT_STOCK')
    │            (Aborts transaction; Prisma issues ROLLBACK)
    │         c. newStock = product.quantity - qty
    │         d. tx.product.update({ where: { id }, data: { quantity: newStock } })
    │         e. tx.stockTransaction.create({ type: 'STOCK_OUT', ... })
    │         f. returns { product, txn, previousStock, newStock }
    │     })
    │  3. OUTSIDE TRANSACTION: AuditService.log({ action: 'STOCK_OUT', ... })
    │  4. Returns calculated stock status
    ▼
[server/controllers/inventoryController.ts]
    │  Returns HTTP 200 { success: true, data: result }
```

### 3.3 Flow: `POST /api/inventory/stock-adjust`
* **Status:** **MISSING / NONEXISTENT.**
* **Finding:** No endpoint exists for stock adjustments. Neither `inventoryRoutes.ts`, `inventoryController.ts`, nor `inventoryService.ts` contains adjustment logic. The string `'ADJUSTMENT'` only exists as an immutable transaction type in fixtures ([`server/seed.ts:382`](../server/seed.ts#L382)), a reporting counter ([`server/services/reportService.ts:79`](../server/services/reportService.ts#L79)), and a frontend type declaration ([`src/types.ts:61`](../src/types.ts#L61)).
* **Impact:** Physical inventory reconciliation cannot be performed via the API.

---

## 4. Inventory Concurrency Analysis

### 4.1 Detailed Scenario Execution
**Parameters:** Initial stock = 10. Request A requests stock-out of 7 units. Request B requests stock-out of 6 units. Both arrive concurrently.

```
SCENARIO 1: Single Node.js Process (Current Setup)
Time    Thread / Event Loop               State / Action
T0      Request A arrives                 Queued on stockLock
T1      Request B arrives                 Chained behind Request A on stockLock
T2      Request A acquires lock           Enters prisma.$transaction
T3      Request A reads product           quantity = 10
T4      Request A validates               10 >= 7 (Passes)
T5      Request A updates product         quantity = 3 (10 - 7)
T6      Request A creates ledger txn      Txn A recorded (10 -> 3)
T7      Request A commits & releases lock Returns HTTP 200
T8      Request B acquires lock           Enters prisma.$transaction
T9      Request B reads product           quantity = 3
T10     Request B validates               3 < 6 (Fails invariant!)
T11     Request B throws AppError         Transaction rolled back
T12     Request B releases lock           Returns HTTP 400 'INSUFFICIENT_STOCK'
Result: Stock = 3. Request A succeeds, Request B fails. Invariant preserved ONLY because of single-process execution.
```

```
SCENARIO 2: Multi-Instance Cluster / Horizontal Scaling (Production Environment)
Node Instance 1 (Request A)                Node Instance 2 (Request B)
T0: Receives Request A                     Receives Request B
T1: stockLock (Local Instance 1) acquired  stockLock (Local Instance 2) acquired
    (Instance 1 knows nothing of Instance 2!)
T2: tx1.findUnique() -> quantity = 10      tx2.findUnique() -> quantity = 10
T3: Validates 10 >= 7 (Passes)             Validates 10 >= 6 (Passes)
T4: Calculates newStock = 3                Calculates newStock = 4
T5: tx1.update(quantity = 3)               tx2.update(quantity = 4)
T6: tx1.commit() -> HTTP 200               tx2.commit() -> HTTP 200 (OVERWRITES INSTANCE 1!)
────────────────────────────────────────────────────────────────────────────────────────
CATASTROPHIC OUTCOME:
- Both requests return HTTP 200 OK.
- Total stock deducted: 7 + 6 = 13 units.
- Actual database stock: 4 units (or 3, depending on commit order).
- 13 physical units leave warehouse, but database claims 4 remain!
- Stock transactions:
    Txn A records: 10 -> 3 (deducted 7)
    Txn B records: 10 -> 4 (deducted 6)
- Ledger is mathematically corrupt; physical stock and ledger are permanently desynchronized.
```

### 4.2 Forensic Scenario Answers

| Question | Forensic Answer |
| :--- | :--- |
| **1. Can both requests read stock = 10?** | **YES.** Across multiple Node instances, or in any transaction running outside the local `AsyncLock` queue, both transactions execute standard `SELECT` queries without locks under `READ COMMITTED` isolation. |
| **2. Does AsyncLock prevent this?** | **ONLY within a single Node process.** It provides zero cross-process, cross-container, or cross-server coordination. |
| **3. Is the protection process-local?** | **YES.** `AsyncLock` is a JavaScript class in V8 heap memory ([`inventoryService.ts:32-44`](../server/services/inventoryService.ts#L32-L44)). |
| **4. What happens if two Node instances run?** | `AsyncLock` is completely bypassed. Race conditions occur, causing lost updates and severe inventory over-allocation. |
| **5. Does PostgreSQL provide the final guarantee?** | **NO.** There is no row locking (`SELECT FOR UPDATE`), no atomic decrement condition (`WHERE quantity >= $qty`), and no check constraint (`CHECK quantity >= 0`). PostgreSQL commits whatever number Node passes to it. |
| **6. Can negative stock occur?** | In the current code, because Node calculates `newStock = previous - qty` and sends an absolute number, the column does not become negative; instead, it causes a **silent lost update** where stock is set to a false positive value (4 units remain after 13 deducted). If an atomic `quantity = quantity - qty` query were run without conditions, negative stock (`-3`) would occur. |
| **7. Can transactions become inconsistent with stock?** | **YES.** Both transactions insert ledger rows claiming they started at 10 and ended at 3 and 4 respectively. The sum of ledger movements ($+10 - 7 - 6 = -3$) contradicts the product row ($+4$). |
| **8. What happens if transaction fails halfway?** | Operations inside `prisma.$transaction` roll back properly. However, [`AuditService.log`](../server/services/inventoryService.ts#L121) executes *after* the transaction commits. If the server crashes or network blips between commit and audit log, the audit record is lost. |

### 4.3 Concurrency Control Strategies Comparison

| Strategy | Cross-Instance Safe? | Per-Product Granularity? | Performance / Contention | Implementation Complexity | Recommendation |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **AsyncLock (Current)** | ❌ No | ❌ No (Global) | 🔴 Poor under multi-SKU load | Low | **Deprecate** |
| **SELECT FOR UPDATE** | ✅ Yes | ✅ Yes | 🟢 High (Row-level lock held briefly) | Low-Medium (Requires `$queryRaw`) | **Recommended (Primary)** |
| **Atomic SQL Update** | ✅ Yes | ✅ Yes | 🟢 Highest (Minimal lock duration) | Low-Medium (`UPDATE ... WHERE qty >= $q`) | **Recommended (Alternative)** |
| **Serializable Isolation**| ✅ Yes | ❌ High aborts | 🔴 Poor under concurrent SKU writes | High (Requires application retry loop) | Not recommended |
| **DB Check Constraint** | ✅ Yes | N/A (Safety Net) | 🟢 Zero overhead until violation | Very Low (`CHECK (quantity >= 0)`) | **MANDATORY (Defense-in-depth)** |
| **Optimistic Locking** | ✅ Yes | ✅ Yes | 🟡 Degrades under high conflict | Medium (Requires version column & retries) | Not recommended for inventory |

**Recommended Technical Strategy:**
Implement **Pessimistic Row Locking (`SELECT ... FOR UPDATE`)** inside `prisma.$transaction` via parameterized `$queryRaw`, coupled with a PostgreSQL **`CHECK (quantity >= 0)` constraint**.

---

## 5. ACID / Transaction Integrity Analysis

### 5.1 Audit of Inventory Transactions

| Transaction Location | Scope of Operations | Atomicity | Consistency | Isolation | Durability | Deficiencies |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| [`inventoryService.ts:84-118`](../server/services/inventoryService.ts#L84-L118) (`stockIn`) | Read product, update quantity, insert `stock_transactions` | ✅ Preserved | ⚠️ App-only | ⚠️ Weak | ✅ WAL | AuditLog called outside transaction |
| [`inventoryService.ts:177-221`](../server/services/inventoryService.ts#L177-L221) (`stockOut`) | Read product, check stock, update quantity, insert `stock_transactions` | ✅ Preserved | ⚠️ App-only | ⚠️ Weak | ✅ WAL | AuditLog called outside transaction; no row lock |
| [`productService.ts:212-244`](../server/services/productService.ts#L212-L244) (`createProduct`) | Insert product, insert initial `STOCK_IN` transaction | ✅ Preserved | ⚠️ App-only | ⚠️ Weak | ✅ WAL | AuditLog called outside transaction |
| [`userService.ts:251-303`](../server/services/userService.ts#L251-L303) (`deleteUser`) | Delete sessions, reassign stock_txns, nullify audit_logs, delete user | ❌ **BROKEN** | ❌ **BROKEN** | ❌ None | ✅ WAL | **NO TRANSACTION!** 4 separate sequential queries |

### 5.2 Forensic ACID Evaluation
* **Atomicity:** In `stockIn` and `stockOut`, database operations are atomic. However, in [`UserService.deleteUser`](../server/services/userService.ts#L274-L290), four destructive mutations are executed sequentially without a `$transaction`. If step 4 fails, steps 1–3 are permanently committed in an orphaned state.
* **Consistency:** Consistency relies 100% on Node.js application logic. If a direct SQL query, migration script, or unhandled concurrency anomaly updates `quantity` to `-5`, PostgreSQL allows it because there is no database-level constraint.
* **Isolation:** Default PostgreSQL isolation is `READ COMMITTED`. Non-repeatable reads and phantom reads are possible. Concurrent `SELECT` queries do not block each other, allowing multiple transactions to read identical stock figures simultaneously.
* **Durability:** Standard PostgreSQL WAL (Write-Ahead Logging) provides durability upon commit.

---

## 6. API Validation Analysis

### 6.1 Audit of Endpoint Input Validation

| Route & Method | Payload Target | Current Validation Technique | Schema / Mechanism | Vulnerabilities & Gaps |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | Body | Zod Schema | `loginSchema` | No rate limiting per email; IP-only |
| `POST /api/auth/change-password` | Body | Zod Schema | `changePasswordSchema` | Password complexity not enforced |
| `GET /api/products` | Query Params | Manual Casting / `as any` | None | `search`, `categoryId`, `status` unvalidated |
| `GET /api/products/:id` | Path Param | None | None | Malformed UUID / string causes raw DB query |
| `POST /api/products` | Body | Zod Schema | `createProductSchema` | Currency precision unvalidated (Float allowed) |
| `PUT /api/products/:id` | Body + Path | Zod Schema (Body only) | `updateProductSchema` | `:id` unvalidated; empty payload allowed |
| `DELETE /api/products/:id` | Path Param | None | None | `:id` unvalidated |
| `POST /api/inventory/stock-in` | Body | Zod Schema | `stockInSchema` | `quantity` allows arbitrarily large integer |
| `POST /api/inventory/stock-out`| Body | Zod Schema | `stockOutSchema` | `quantity` unconstrained on upper bound |
| `GET /api/inventory/transactions` | Query Params | Manual Casting | `Number(limit) \|\| 100` | No maximum limit cap (DoS vector) |
| `GET /api/users` | Query Params | None | None | No pagination support |
| `POST /api/users` | Body | Zod Schema | `createUserSchema` | Weak password default (`StockFlow@123`) |
| `PATCH /api/users/:id/deactivate` | Path Param | None | None | `:id` unvalidated |
| `DELETE /api/users/:id` | Path Param | None | None | `:id` unvalidated |
| `POST /api/system/wipe` | Body | None | None | No confirmation token payload required |

### 6.2 Zod Implementation Strategy
Currently, `zod` is installed in `package.json` (^4.5.2) and used selectively in controllers. However:
1. It is not implemented as an Express middleware pipeline.
2. Request query parameters and path parameters (`req.params`, `req.query`) completely bypass validation.
3. Numeric pagination parameters (`limit`, `page`) are parsed with fallback numbers without ceiling limits, exposing the server to memory exhaustion attacks (`?limit=1000000`).

---

## 7. Authentication Analysis

### 7.1 Current Implementation Forensic Review
* **Mechanism:** Stateful database sessions. Upon login ([`authService.ts:63`](../server/services/authService.ts#L63)), a 32-byte cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`) is generated and inserted into the `sessions` table with a 7-day TTL (`expiresAt`).
* **Password Security:** Hashes stored using `bcryptjs` with 10 salt rounds. Login comparison uses constant-time `bcrypt.compare`.
* **Cookie Transmission:** Cookie `stockflow_session` is issued with flags:
  * `httpOnly: true` (Protects against XSS document cookie theft)
  * `secure: process.env.NODE_ENV === 'production'`
  * `sameSite: 'lax'` (Mitigates cross-site request forgery)
  * `path: '/'`
* **Session Revocation:** On logout or account deactivation, the session row is deleted from the PostgreSQL `sessions` table.

### 7.2 Security Weaknesses Identified
1. **Disabled Content Security Policy (CSP):** In [`server/app.ts:41`](../server/app.ts#L41), Helmet is configured with `{ contentSecurityPolicy: false }`.
2. **In-Memory Rate Limiter:** [`server/middleware/rateLimiter.ts`](../server/middleware/rateLimiter.ts) stores IP buckets in a JavaScript `Map`. Restarting the server resets all rate limits, and in a multi-instance deployment, rate limits are not shared.
3. **No Account Lockout:** Rate limiting tracks client IP only. A distributed attacker using multiple proxy IPs can execute a credential stuffing attack against a specific email without triggering the IP limiter.
4. **Weak Password Policy:** Passwords require only 8 characters without entropy checks (uppercase, digits, special characters).
5. **No Session Sliding Expiration:** Sessions expire strictly 7 days after creation, even if the user is actively using the system.

---

## 8. Authorization / RBAC Analysis

### 8.1 Current Roles & Enforcement Matrix

```
┌──────────────────────────────────────┬─────────────┬─────────────┬──────────────────────────────┐
│ Capability / Route                   │ ADMIN       │ STAFF       │ Audited Enforcement         │
├──────────────────────────────────────┼─────────────┼─────────────┼──────────────────────────────┤
│ GET /api/auth/me                     │ Allowed     │ Allowed     │ requireAuth                  │
│ POST /api/auth/change-password       │ Allowed     │ Allowed     │ requireAuth                  │
│ GET /api/products (List/Detail)      │ Allowed     │ Allowed     │ requireAuth                  │
│ POST, PUT, DELETE /api/products      │ Allowed     │ FORBIDDEN   │ requireRole('ADMIN')         │
│ GET /api/categories, /api/suppliers  │ Allowed     │ Allowed     │ requireAuth                  │
│ POST, PUT, DELETE Categories/Vendors │ Allowed     │ FORBIDDEN   │ requireRole('ADMIN')         │
│ GET /api/inventory                   │ Allowed     │ Allowed     │ requireAuth                  │
│ POST /api/inventory/stock-in         │ Allowed     │ Allowed     │ requireAuth                  │
│ POST /api/inventory/stock-out        │ Allowed     │ Allowed     │ requireAuth                  │
│ GET /api/reports/*                   │ Allowed     │ Allowed     │ requireAuth                  │
│ GET, POST, PUT, DELETE /api/users    │ Allowed     │ FORBIDDEN   │ requireRole('ADMIN')         │
│ GET /api/users/audit-logs            │ Allowed     │ FORBIDDEN   │ requireRole('ADMIN')         │
│ POST /api/system/wipe                │ Allowed     │ FORBIDDEN   │ requireRole('ADMIN')         │
└──────────────────────────────────────┴─────────────┴─────────────┴──────────────────────────────┘
```

### 8.2 Architectural Evaluation of RBAC
* **Current Model:** Hardcoded binary role enforcement (`ADMIN` vs `STAFF`).
* **Implementation Quality:** Positive: RBAC is enforced on backend Express routes via [`requireRole('ADMIN')`](../server/middleware/rbac.ts#L24-L45), not merely hidden in the React UI.
* **Limitations:**
  1. No fine-grained permissions (e.g. warehouse staff who can stock-in cannot be restricted from stock-out).
  2. Staff can access financial valuation reports (`GET /api/reports/valuation`), which may be sensitive in an enterprise environment.
* **Minimum Practical Improvement:** Introduce a centralized permission dictionary (`PERMISSIONS`) mapped to existing roles, allowing route guards like `requirePermission('products:write')` without adding database complexity.

---

## 9. Idempotency Analysis

### 9.1 Network Retry Vulnerability Audit
**Scenario:** A client submits a `POST /api/inventory/stock-out` request for 5 units. The server processes the transaction and deducts inventory. However, the client's network connection drops before receiving the HTTP 200 response. The client retries the request.

```
Client                             Server / Database
  │  POST /stock-out (Qty: 5)              │
  ├───────────────────────────────────────►│ 1. Deducts 5 units (Stock: 15 -> 10)
  │                                        │ 2. Creates Txn record #1
  │   [Network connection dropped]         │ 3. Commits transaction
  │x - - - - - - - - - - - - - - - - - - - │
  │                                        │
  │  Client Retries POST /stock-out        │
  ├───────────────────────────────────────►│ 4. Deducts ANOTHER 5 units (Stock: 10 -> 5)
  │                                        │ 5. Creates Txn record #2
  │◄───────────────────────────────────────┤ 6. Returns HTTP 200 OK
  │                                        │
Result: 10 units were deducted instead of 5! System is NON-IDEMPOTENT.
```

### 9.2 Current Safeguards
* **Idempotency Keys:** **Missing.** No `Idempotency-Key` HTTP header is supported or inspected.
* **Transaction Reference Uniqueness:** In [`prisma/schema.prisma:100`](../prisma/schema.prisma#L100), `reference` is an optional, non-unique string column (`reference String?`).
* **Cached Responses:** No mechanism exists to cache previously executed request results.

---

## 10. Audit Logging Analysis

### 10.1 Audit Log Schema Review

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  action    String
  entity    String
  entityId  String?  @map("entity_id")
  details   String?  // Stored as unindexed JSON string
  ipAddress String?  @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 10.2 Forensic Evaluation: 5 Ws

| Forensic Question | Current Status | Audited Finding |
| :--- | :---: | :--- |
| **WHO?** | Partial | Recorded via `userId`. However, if a user is deleted, [`UserService.deleteUser`](../server/services/userService.ts#L284-L287) explicitly sets `userId = null` across all historical audit logs, permanently erasing who performed past actions! |
| **WHAT?** | Partial | High-level string action (e.g. `'PRODUCT_UPDATE'`). |
| **WHEN?** | Implemented | System timestamp `createdAt`. |
| **WHERE?** | Partial | `ipAddress` captured. Client `User-Agent` is omitted. |
| **WHAT CHANGED?** | Inconsistent | Changes are serialized as an ad-hoc JSON string in `details`. Some actions log diffs; others log only entity names. There are no dedicated `old_value` and `new_value` structures. |

**Critical Architectural Defect:**
[`AuditService.log`](../server/services/auditService.ts#L4-L29) swallows all errors inside an empty `try/catch`:
```typescript
try {
  return await prisma.auditLog.create({ ... });
} catch (err) {
  console.error('[AuditService.log Error]', err);
}
```
If logging fails, execution proceeds silently without alerting the caller or rolling back the business operation.

---

## 11. Observability Analysis

### 11.1 Logging Audit
* **Implementation:** The sole logging mechanism is [`server/middleware/logger.ts`](../server/middleware/logger.ts):
  ```typescript
  console.log(`[API] ${method} ${originalUrl} ${status} - ${duration}ms`);
  ```
* **Gaps:**
  * Output is plain text string, not machine-parseable JSON.
  * No request or correlation IDs to trace operations across middleware, services, and queries.
  * No standard log levels (`trace`, `debug`, `info`, `warn`, `error`).
  * In production, logs lack context (user ID, tenant, memory, error stack).

### 11.2 Health Check Audit
* **Endpoint:** `GET /api/health` in [`server/app.ts:61-67`](../server/app.ts#L61-L67).
* **Defect:** This is a **shallow liveness check**. It does not ping PostgreSQL (`SELECT 1`). If the database connection pool is exhausted or credentials expire, `/api/health` continues returning HTTP 200 while all customer requests fail with HTTP 500.
* **Missing:** No readiness check (`/api/health/ready`) or database status inspection.

---

## 12. Testing Analysis

### 12.1 Code Coverage Breakdown
The repository reports **86.49% line coverage** on `server/**/*.ts`. However, forensic inspection of [`coverage/index.html`](../coverage/index.html) reveals:

```
Statements : 84.93% ( 558/657 )
Branches   : 62.88% ( 222/353 )  <-- OVER 130 LOGICAL BRANCHES UNTESTED
Functions  : 90.74% ( 98/108 )
Lines      : 86.49% ( 538/622 )
```

### 12.2 What the Coverage Represents vs. What is Missing

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ What Existing Tests Actually Prove           │ Critical Test Scenarios Completely Missing   │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ Single-process concurrency (via AsyncLock)   │ Multi-process / cross-instance race condition│
│ Basic happy-path Stock-In & Stock-Out        │ Idempotent request retry behavior            │
│ Rejection of quantity > available stock      │ Database CHECK constraint enforcement        │
│ Rejection of duplicate SKUs on creation      │ Malformed query parameters and path IDs      │
│ Basic RBAC route blocks (Staff vs Admin)     │ Unhandled database disconnect rollback       │
│ User deactivation session purge              │ End-to-End user workflows (Playwright)       │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 13. Database Analysis

### 13.1 Schema & Relational Integrity

```
                               ┌──────────────┐
                               │     User     │
                               └──────┬───────┘
                                      │ 1
                         ┌────────────┼────────────┐
                         │ 1:N        │ 1:N        │ 1:N
                         ▼            ▼            ▼
                   ┌──────────┐ ┌───────────┐ ┌──────────┐
                   │ Session  │ │ StockTxn  │ │ AuditLog │
                   └──────────┘ └─────┬─────┘ └──────────┘
                                      │ N
                                      │
┌──────────────┐ 1             1:N    │
│   Category   ├────────────────┐     │
└──────────────┘                │     │
                                ▼     ▼ N
┌──────────────┐ 1             ┌────────────┐
│   Supplier   ├──────────────►│  Product   │
└──────────────┘ 1:N (Nullable)└────────────┘
```

### 13.2 Database Deficiencies
1. **Missing Check Constraints:** The schema has NO constraint enforcing `quantity >= 0`, `price >= 0`, or `reorder_level >= 0`.
2. **Currency Representation:** In `Product`, `price` is typed as `Float`. Floating-point numbers are susceptible to binary rounding errors. Financial applications must use `Decimal` / `Numeric`.
3. **Missing Migration History:** The repository relies on `prisma db push`. No `prisma/migrations` folder exists. `db push` cannot execute custom SQL scripts (such as `ADD CONSTRAINT CHECK`) and is dangerous for production deployments.
4. **Environment Disconnect:** The local `.env` specifies `DATABASE_URL="file:./dev.db"` (SQLite), while `schema.prisma` declares `provider = "postgresql"`. Prisma Client will reject this mismatch upon execution.

---

## 14. Security Analysis

### 14.1 Forensic Vulnerability Findings

> [!CAUTION]
> **CRITICAL VULNERABILITY (P0): Hardcoded Production Credentials in Dockerfile**  
> In [`Dockerfile:20-21`](../Dockerfile#L20-L21), live production database connection credentials and JWT signing keys are hardcoded directly into the Docker image build instructions! Anyone with access to the Docker image or repository can extract full administrative database credentials.

* **Helmet Security Headers:** CSP is disabled in [`server/app.ts:41`](../server/app.ts#L41).
* **Rate Limiting:** Limited to login only; unauthenticated attackers can spam other public/protected routes.
* **Audit Trail Erasure:** User deletion overwrites historical audit logs with `NULL`, defeating compliance audit trails.
* **Dependency Scanning:** No automated container or dependency vulnerability scanner (e.g. Trivy, OSV-Scanner, `npm audit`) is integrated into CI.

---

## 15. Deployment Analysis

### 15.1 Production Configuration Review
* **Render Config ([`render.yaml`](../render.yaml)):**
  ```yaml
  buildCommand: npm install && npx prisma db push --skip-generate && npm run build
  startCommand: npm start
  envVars:
    - key: DATABASE_URL
      value: file:./dev.db
  ```
  **Critical Defect:** Deploys a production web service with an ephemeral SQLite file URL (`file:./dev.db`), completely contradicting the PostgreSQL schema provider.
* **Dockerfile ([`Dockerfile`](../Dockerfile)):**
  Runs `npx tsx server/index.ts` in production rather than executing compiled JavaScript, introducing significant Node memory overhead.

---

## 16. Documentation Analysis

### 16.1 Reality vs. Documentation Gap

| Documented Claim | Source File | Reality Found in Code |
| :--- | :--- | :--- |
| "ACID stock-in, stock-out, and adjustment operations" | [`README.md:28`](../README.md#L28) | No adjustment endpoint exists anywhere in the codebase. |
| "PostgreSQL row-level locks prevent race conditions" | [`docs/BUSINESS_RULES.md`](BUSINESS_RULES.md) | Uses in-memory JavaScript `AsyncLock` queue; zero row locks. |
| "Permanent Cloud Persistence on Render PostgreSQL" | [`README.md:24`](../README.md#L24) | `render.yaml` and `.env` specify `file:./dev.db`. |
| "CI validates linting" | [`README.md:32`](../README.md#L32) | GitHub Actions CI workflow contains no lint step. |

---

## 17. Current Strengths

1. **Clean Codebase & Typings:** Clean, modern TypeScript 5.7 implementation with strict compiler settings.
2. **Excellent Component Architecture:** The React 19 UI is well-structured, modular, and visually polished with Tailwind CSS v4 design tokens.
3. **Session Revocation Invariant:** Immediate purging of active sessions upon account deactivation is implemented and verified.
4. **Normalized Database Schema:** Clean third-normal-form relational data models.
5. **Separation of Application State:** Frontend Context is cleanly segregated into `Auth`, `Inventory`, and `UI` slices.

---

## 18. Critical Risks

1. **Inventory Corruption Under Concurrency (P0):** In any multi-instance or scaled deployment, concurrent stock deductions cause lost updates and incorrect inventory levels.
2. **Hardcoded Secrets in Docker Image (P0):** Database credentials and secret keys are exposed in image build layers.
3. **Deployment Disconnect (P0):** SQLite connection strings in `render.yaml` and `.env` conflict with the PostgreSQL Prisma provider.
4. **Lack of Idempotency (P1):** Network retries on stock operations cause duplicate inventory deductions.
5. **No Migration System (P1):** Reliance on `prisma db push` prevents reproducible schema evolution.

---

## 19. Recommended Changes

### Recommendation 1: Database-Level Concurrency & Integrity
* **Priority:** P0
* **Problem:** `AsyncLock` is single-process only; database has no check constraints.
* **Current Implementation:** In-memory queue in [`server/services/inventoryService.ts`](../server/services/inventoryService.ts).
* **Recommended Solution:** Replace `AsyncLock` with `SELECT ... FOR UPDATE` via `tx.$queryRaw` inside `prisma.$transaction`. Add `CHECK (quantity >= 0)` constraint via a Prisma migration.
* **Files Affected:** [`server/services/inventoryService.ts`](../server/services/inventoryService.ts), [`prisma/schema.prisma`](../prisma/schema.prisma), migration SQL.
* **Dependencies Required:** None.
* **Database Changes:** Add check constraint `chk_product_quantity_non_negative`.
* **Testing Required:** Concurrent integration test simulating parallel multi-process requests.
* **Risk of Change:** Low.
* **Estimated Complexity:** Medium.
* **Reason:** Guarantees absolute transactional integrity across any number of server replicas.

### Recommendation 2: Remove Hardcoded Secrets & Fix Deployment
* **Priority:** P0
* **Problem:** Credentials hardcoded in `Dockerfile`; broken SQLite URL in `render.yaml`.
* **Current Implementation:** Lines 20–21 in [`Dockerfile`](../Dockerfile) and line 12 in [`render.yaml`](../render.yaml).
* **Recommended Solution:** Remove credentials from `Dockerfile`; inject via environment variables. Configure `render.yaml` to reference a managed PostgreSQL instance.
* **Files Affected:** [`Dockerfile`](../Dockerfile), [`render.yaml`](../render.yaml), [`.env.example`](../.env.example).
* **Dependencies Required:** None.
* **Database Changes:** None.
* **Testing Required:** Docker build and container run test.
* **Risk of Change:** Low.
* **Estimated Complexity:** Low.
* **Reason:** Essential security hygiene and operational baseline.

### Recommendation 3: Comprehensive Zod Input Validation Pipeline
* **Priority:** P1
* **Problem:** Query strings and path parameters are unvalidated.
* **Current Implementation:** Ad-hoc `schema.parse(req.body)` inside controllers.
* **Recommended Solution:** Create an Express validation middleware `validateRequest({ body, query, params })`.
* **Files Affected:** `server/middleware/validate.ts` (new), all controllers and routes.
* **Dependencies Required:** Existing `zod`.
* **Database Changes:** None.
* **Testing Required:** Unit tests for invalid UUIDs, negative numbers, and boundary payloads.
* **Risk of Change:** Low.
* **Estimated Complexity:** Medium.
* **Reason:** Hardens the API against malformed inputs and injection attacks.

### Recommendation 4: Idempotency Key Engine for Stock Mutations
* **Priority:** P1
* **Problem:** Network retries cause duplicate stock deductions.
* **Current Implementation:** None.
* **Recommended Solution:** Implement an `Idempotency-Key` middleware and storage table to deduplicate mutation requests.
* **Files Affected:** New middleware, new Prisma model `IdempotencyRecord`, [`server/routes/inventoryRoutes.ts`](../server/routes/inventoryRoutes.ts).
* **Dependencies Required:** None.
* **Database Changes:** Add `idempotency_records` table with key, request hash, response body, and expiration.
* **Testing Required:** Automated retry test sending duplicate requests with same key.
* **Risk of Change:** Medium.
* **Estimated Complexity:** Medium.
* **Reason:** Critical for real-world warehouse operations over unstable networks.

---

## 20. Priority Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ P0 — CRITICAL CORRECTNESS & SECURITY ISSUES (Must address before any production use)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Eliminate hardcoded secrets from Dockerfile & fix render.yaml connection string     │
│ 2. Implement PostgreSQL row-level locks (SELECT FOR UPDATE) & DB quantity >= 0 check   │
│ 3. Wrap multi-query administrative operations (deleteUser) in ACID transactions       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ P1 — HIGH-PRIORITY PRODUCTION-MINDED IMPROVEMENTS                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. Transition from `prisma db push` to formal, reproducible SQL migrations             │
│ 5. Implement request validation middleware covering body, query, and path parameters   │
│ 6. Implement Idempotency-Key support for Stock-In and Stock-Out operations             │
│ 7. Implement atomic stock adjustment endpoint (POST /api/inventory/adjust)             │
│ 8. Enforce atomic audit logging inside database transactions                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ P2 — IMPORTANT IMPROVEMENTS                                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 9. Structured JSON logging (Pino) with correlation / request IDs                       │
│ 10. Deep database health check endpoint (/api/health/ready)                            │
│ 11. Replace in-process rate limiter with Redis-compatible or persistent store          │
│ 12. End-to-end integration test suite using Testcontainers for PostgreSQL              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ P3 — NICE-TO-HAVE ENHANCEMENTS                                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 13. Granular permission-based authorization matrix                                     │
│ 14. Full Playwright E2E browser automation suite                                       │
│ 15. Container image vulnerability scanning (Trivy) in CI workflow                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 21. Phased Implementation Roadmap

```
PHASE 1: Database-Level Concurrency & Integrity
  │  - Add CHECK (quantity >= 0) constraint
  │  - Implement SELECT ... FOR UPDATE in InventoryService
  │  - Remove process-local AsyncLock
  ▼
PHASE 2: Zod API Validation Pipeline
  │  - Create validateRequest middleware
  │  - Validate query strings, path IDs, and mutation bodies
  ▼
PHASE 3: Idempotency & Audit Hardening
  │  - Add Idempotency-Key middleware and storage table
  │  - Make audit logging atomic inside database transactions
  │  - Implement missing POST /api/inventory/adjust endpoint
  ▼
PHASE 4: Integration & Concurrency Testing
  │  - Multi-instance concurrency integration tests
  │  - Test transaction rollbacks and constraint violations
  ▼
PHASE 5: End-to-End (E2E) Testing
  │  - Setup Playwright for critical warehouse flows
  ▼
PHASE 6: Structured Logging, Request IDs & Deep Health Checks
  │  - Integrate Pino structured JSON logger
  │  - Add X-Request-Id correlation tracking
  │  - Deep database readiness check (/api/health/ready)
  ▼
PHASE 7: Granular Authorization
  │  - Map roles to discrete permissions
  ▼
PHASE 8: Security & Container Hardening
  │  - Purge secrets from Dockerfile & inject via env
  │  - Add Trivy container scanning in CI
  ▼
PHASE 9: Database Migration & Operational Runbook
     - Establish formal Prisma migrations
     - Document backup, restore, and disaster recovery
```

### Phase 1: Database-Level Concurrency & Integrity
* **Objective:** Replace process-local mutex with database-level pessimistic locking and PostgreSQL check constraints.
* **Exact Files Affected:**
  * [`server/services/inventoryService.ts`](../server/services/inventoryService.ts)
  * [`prisma/schema.prisma`](../prisma/schema.prisma)
  * `prisma/migrations/xxxxxx_add_quantity_check_constraint/migration.sql` (new)
* **Schema Changes:** Add `CONSTRAINT chk_product_quantity_non_negative CHECK (quantity >= 0)` to `products` table.
* **New Dependencies:** None.
* **Implementation Steps:**
  1. Generate a Prisma migration adding the SQL check constraint on `products.quantity`.
  2. In `InventoryService.stockIn` and `stockOut`, replace `findUnique` with raw SQL row locking:
     `SELECT id, quantity, reorder_level FROM products WHERE id = $1 FOR UPDATE`.
  3. Remove the `AsyncLock` class and global `stockLock` instance.
* **Tests Required:** Multi-request race condition test verifying that 10 parallel requests cannot over-deduct or cause deadlocks.
* **Acceptance Criteria:** Under concurrent load, zero lost updates occur and negative stock is physically rejected by PostgreSQL.
* **Rollback Considerations:** Revert migration SQL; restore previous service file.

### Phase 2: Zod API Validation Pipeline
* **Objective:** Ensure 100% of incoming data (bodies, path parameters, query filters) is validated before reaching controllers.
* **Exact Files Affected:**
  * `server/middleware/validate.ts` (new)
  * [`server/controllers/productController.ts`](../server/controllers/productController.ts)
  * [`server/controllers/inventoryController.ts`](../server/controllers/inventoryController.ts)
  * [`server/controllers/userController.ts`](../server/controllers/userController.ts)
  * All route definitions in [`server/routes/`](../server/routes/)
* **Schema Changes:** None.
* **New Dependencies:** None (reuses `zod`).
* **Implementation Steps:**
  1. Create a generic `validateRequest({ params?, query?, body? })` Express middleware.
  2. Define schemas for UUID path parameters and pagination query strings (`page`, `limit` capped at 100).
  3. Mount validation middleware on all route definitions.
* **Tests Required:** Unit tests verifying HTTP 400 rejection for malformed UUIDs, negative limits, and extra fields.
* **Acceptance Criteria:** Zero unhandled Zod or database type errors in controller execution.
* **Rollback Considerations:** Safe to revert middleware decorators without database impact.

### Phase 3: Idempotency & Audit Hardening
* **Objective:** Prevent duplicate stock deductions on network retries and ensure audit logs are transactionally atomic.
* **Exact Files Affected:**
  * `server/middleware/idempotency.ts` (new)
  * [`server/services/inventoryService.ts`](../server/services/inventoryService.ts)
  * [`server/controllers/inventoryController.ts`](../server/controllers/inventoryController.ts)
  * [`server/routes/inventoryRoutes.ts`](../server/routes/inventoryRoutes.ts)
  * [`prisma/schema.prisma`](../prisma/schema.prisma)
* **Schema Changes:** Add `IdempotencyRecord` table (`key`, `requestHash`, `responseCode`, `responseBody`, `expiresAt`).
* **New Dependencies:** None.
* **Implementation Steps:**
  1. Create `IdempotencyRecord` model in Prisma.
  2. Implement `idempotency` middleware that checks incoming `Idempotency-Key` header, returning cached responses for identical requests.
  3. Move `AuditService.log` calls *inside* the `prisma.$transaction` block.
  4. Implement missing `POST /api/inventory/adjust` endpoint with dedicated schema and ledger transaction type `ADJUSTMENT`.
* **Tests Required:** Test submitting duplicate requests with identical `Idempotency-Key` and verifying only one deduction occurs.
* **Acceptance Criteria:** Retrying a dropped stock-out returns the original HTTP 200 payload without double-deducting stock.
* **Rollback Considerations:** Drop `idempotency_records` table and remove middleware.

### Phase 4: Integration & Concurrency Testing
* **Objective:** Verify transactional integrity, error rollbacks, and multi-instance concurrency against real PostgreSQL.
* **Exact Files Affected:**
  * [`tests/concurrency.test.ts`](../tests/concurrency.test.ts)
  * `tests/integration/concurrency-postgres.test.ts` (new)
* **Schema Changes:** None.
* **New Dependencies:** `testcontainers` (optional, for local containerized Postgres testing).
* **Implementation Steps:**
  1. Build multi-connection concurrent tests simulating parallel HTTP clients executing against a real PostgreSQL instance.
  2. Test simulated server failure midway through transaction to verify zero partial mutations.
* **Tests Required:** Run Vitest suite against containerized PostgreSQL.
* **Acceptance Criteria:** 100% of concurrency tests pass without `AsyncLock`.
* **Rollback Considerations:** None (test files only).

### Phase 5: End-to-End (E2E) Testing
* **Objective:** Validate critical operational flows from the user perspective (browser to database).
* **Exact Files Affected:**
  * `e2e/auth.spec.ts` (new)
  * `e2e/inventory-flow.spec.ts` (new)
  * `playwright.config.ts` (new)
* **Schema Changes:** None.
* **New Dependencies:** `@playwright/test`.
* **Implementation Steps:**
  1. Initialize Playwright configuration.
  2. Write automated browser tests for Login -> Product Creation -> Stock-In -> Stock-Out -> Report Inspection.
* **Tests Required:** Execute `npx playwright test`.
* **Acceptance Criteria:** E2E suite passes in CI headless mode.
* **Rollback Considerations:** Remove `e2e/` folder.

### Phase 6: Structured Logging, Request IDs & Deep Health Checks
* **Objective:** Provide enterprise-grade observability and container orchestrator readiness inspection.
* **Exact Files Affected:**
  * [`server/middleware/logger.ts`](../server/middleware/logger.ts)
  * [`server/app.ts`](../server/app.ts)
* **Schema Changes:** None.
* **New Dependencies:** `pino`, `pino-http`.
* **Implementation Steps:**
  1. Replace `requestLogger` with `pino-http`, automatically generating `X-Request-Id` headers.
  2. Update `/api/health` to include a deep check executing `prisma.$queryRaw\`SELECT 1\``.
  3. Mount `/api/health/ready` and `/api/health/live`.
* **Tests Required:** Test `/api/health` returns 503 when the database is stopped.
* **Acceptance Criteria:** Logs output structured JSON containing `reqId`, `method`, `url`, `status`, and `latencyMs`.
* **Rollback Considerations:** Revert logger to standard Express middleware.

### Phase 7: Granular Authorization
* **Objective:** Transition from coarse binary role checks to an extensible permission-based model.
* **Exact Files Affected:**
  * [`server/middleware/rbac.ts`](../server/middleware/rbac.ts)
  * All route files in [`server/routes/`](../server/routes/)
* **Schema Changes:** None.
* **New Dependencies:** None.
* **Implementation Steps:**
  1. Define `Permission` type (`'products:read' | 'products:write' | 'stock:in' | 'stock:out' | 'reports:valuation' | ...`).
  2. Define role-to-permission mapping dictionary.
  3. Implement `requirePermission(perm)` middleware.
* **Tests Required:** Test that Staff is rejected from `reports:valuation`.
* **Acceptance Criteria:** Permissions enforced cleanly without modifying database user roles.
* **Rollback Considerations:** Restore previous `requireRole` middleware.

### Phase 8: Security & Container Hardening
* **Objective:** Eliminate hardcoded secrets, harden container configuration, and integrate automated security scanners.
* **Exact Files Affected:**
  * [`Dockerfile`](../Dockerfile)
  * [`render.yaml`](../render.yaml)
  * [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
* **Schema Changes:** None.
* **New Dependencies:** None.
* **Implementation Steps:**
  1. Remove all hardcoded `ENV` secrets from `Dockerfile`.
  2. Update Docker build to compile TypeScript to JavaScript (`npm run build:server`) and run node directly on `dist/server/index.js`.
  3. Add `npm audit --audit-level=high` and Trivy container scan step to CI workflow.
* **Tests Required:** Run `docker build` and verify zero credentials exist in image layers (`docker history`).
* **Acceptance Criteria:** Clean vulnerability scan report in CI.
* **Rollback Considerations:** Revert Dockerfile edits.

### Phase 9: Database Migration & Operational Runbook
* **Objective:** Establish formal migration tracking and provide operational runbooks for backup, restore, and disaster recovery.
* **Exact Files Affected:**
  * `prisma/migrations/` (new)
  * `docs/RUNBOOK.md` (new)
  * [`README.md`](../README.md)
* **Schema Changes:** Baseline initial migration generated via `prisma migrate diff`.
* **New Dependencies:** None.
* **Implementation Steps:**
  1. Create initial baseline migration.
  2. Update CI and deployment scripts to use `prisma migrate deploy` instead of `db push`.
  3. Write production runbook documenting `pg_dump` backup, point-in-time recovery, and emergency rollback procedures.
* **Tests Required:** Verify a clean developer workstation can initialize the database using `prisma migrate deploy && tsx server/seed.ts`.
* **Acceptance Criteria:** Zero reliance on `prisma db push` across all environments.
* **Rollback Considerations:** Maintain backup SQL dumps before initial migration deployment.
