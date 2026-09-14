# StockFlow — Enterprise Inventory & Operations Management System

[![CI Pipeline](https://github.com/Ahmad-Codemaster/stockflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahmad-Codemaster/stockflow/actions/workflows/ci.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.7%20(Strict)-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express 5](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Vitest-64%20Tests%20Passing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 | Node.js + Express 5 + Prisma ORM (PostgreSQL) | Docker + Render | Vitest + GitHub Actions CI

**StockFlow** is a security-hardened inventory and operations management platform engineered for businesses requiring strict stock-in/stock-out workflows, multi-supplier tracking, real-time inventory valuation, session-based role authorization (Admin vs. Staff), database-level concurrency protection, and operational reporting.

---

## 🌐 Live Deployment & Technical Specifications

| Resource | Link / Details |
| :--- | :--- |
| **GitHub Repository** | [https://github.com/Ahmad-Codemaster/stockflow](https://github.com/Ahmad-Codemaster/stockflow) |
| **Default Administrator** | Email: `admin@stockflow.com` \| Password: `Admin@123` |
| **Production Runbook** | [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) (Migrations, Deploys, Backup/Restore, Rollback, Troubleshooting) |
| **Cloud Deployment Guide** | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) (Docker containerization & Render Blueprint) |
| **System Architecture** | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) (Service layer boundaries & transactional model) |
| **Database & ERD** | [`docs/DATABASE.md`](./docs/DATABASE.md) (Relational schema, indexes & constraints) |
| **REST API Contracts** | [`docs/API.md`](./docs/API.md) (Endpoints, Zod DTOs & response schemas) |
| **RBAC Security Matrix** | [`docs/RBAC.md`](./docs/RBAC.md) (Role permissions & server-side enforcement rules) |
| **Business Invariants** | [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) (Domain rules, locking formulas & audit policies) |
| **Tech Stack Guide** | [`TECH_STACK_GUIDE.md`](./TECH_STACK_GUIDE.md) (All tools, Docker architecture & interview prep) |
| **Engineering Build Log** | [`BUILD_LOG.md`](./BUILD_LOG.md) (Chronological milestones & architectural evolution) |
| **AI Usage Disclosure** | [`AI_USAGE.md`](./AI_USAGE.md) (Toolchain, prompt engineering & methodology disclosures) |

---

## 🌟 Core System Highlights & Recent Iterations

### 1. Production Hardening (Phase 1-6)
- **P1 — Database-Level Concurrency Control:**
  - Replaced in-memory mutexes with PostgreSQL row-level pessimistic locking (**`SELECT ... FOR UPDATE`**) within atomic ACID transactions (`prisma.$transaction`).
  - Serializes concurrent operations on the same product row across multi-instance clusters.
  - Enforces database constraint `CHECK ("quantity" >= 0)` guaranteeing inventory can never drop below zero under high contention.
- **P2 — Strong API Boundary Validation (Zod):**
  - Comprehensive Zod schemas applied across all request bodies, route parameters (`:id`), and query parameters (`limit`, `status`, `page`).
  - Automatically strips unknown/injected malicious fields and rejects invalid inputs with descriptive `VALIDATION_ERROR` (HTTP 400) payloads.
- **P3 — Comprehensive Integration & Concurrency Test Suite:**
  - **55 automated tests across 14 test suites** covering complete 8-step inventory lifecycles, atomic stock-in/out, duplicate SKU conflict handling (HTTP 409), last-admin protections, and parallel burst concurrency (competing over-allocation, exact exhaustion, equal contention).
- **P4 — Full-Stack Observability & Health Monitoring:**
  - Zero-dependency structured JSON logging with correlation IDs (`X-Request-Id`) across all HTTP requests.
  - Three dedicated health endpoints:
    - `GET /api/health/live` — Fast container liveness ping (zero DB hit).
    - `GET /api/health/ready` — Deep readiness probe validating live PostgreSQL connectivity, query latency in ms, process uptime, and memory metrics (RSS / Heap).
    - `GET /api/health` — Full operational health status probe.
- **P5 — Multi-Tier Production Security & Rate Limiting:**
  - Sensitive endpoints protected by sliding-window rate limiters:
    - Auth (`/api/auth/login`): **20 attempts per 15 minutes** per IP (returns HTTP 429 with `Retry-After` header).
    - Inventory Mutations (`/stock-in`, `/stock-out`, `/adjust`): **60 requests per minute** per IP (`mutationLimiter`).
    - Emergency Wipe (`/api/system/wipe`): Strictly limited to **3 requests per 10 minutes** per IP (`strictLimiter`).
  - Cryptographically secure 64-character session tokens stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
  - Helmet HTTP security headers and automated dependency vulnerability scanning in CI (`npm audit`).
- **P6 — Comprehensive Operational Runbook:**
  - Detailed production guide in [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) covering Prisma migrations (`migrate deploy`), Docker deployment, credential rotation, `pg_dump -Fc` backups & retention schedules, disaster recovery restores, application rollback, and incident troubleshooting.

### 2. Modern Apple Glass UI / UX & Layout Redesign
- **Vibrant Sunset Orange & Royal Purple Ambient Aurora:**
  - High-vibrancy ambient mesh combining fiery warm Orange (`#F97316`, `#FB923C`) and deep Royal Purple (`#A855F7`, `#7C3AED`).
  - Four continuous GPU-accelerated keyframe drift animations (`ambientDrift1` to `ambientDrift4`, 18s–24s smooth looping cycles) providing an organic living aurora glow.
  - Glassmorphic card design (`rgba(255, 255, 255, 0.39)`, `backdrop-filter: blur(52px)`, 70% rounded corners `rounded-[17px]`, and subtle modern drop shadows).
  - Smooth View Transition API page navigation with fade-slide animations.
- **Sleek & Compact Desktop Sidebar (`w-56`):**
  - Compacted from `w-64` to `w-56` (224px) with refined button padding (`px-2.5 py-1.5`) and typography, maximizing screen width for data visualization and tables.
- **Redesigned Operations Dashboard (Zero Height Stretching):**
  - Eliminated vertical height stretching of the `Inventory Distribution` card by introducing a balanced **12-column two-pillar layout (`items-start`)**:
    - **Left Pillar (`xl:col-span-7`)**: 7-day Stock Velocity chart with net movement metrics (+In, -Out, Net) and the Recent Movement Ledger table.
    - **Right Pillar (`xl:col-span-5`)**: Naturally sized Inventory Distribution card (multi-segment status bar, interactive pills with counts and percentages, stock health gauge, and fast operational shortcuts) and Category Valuation donut chart.
    - **Bottom Row**: Restock Priority Queue with 1-click Restock shortcuts into the Stock-In workflow.
    - Compact KPI metrics cards with live SVG sparklines.
- **Dense & Compact Inventory Monitoring Page:**
  - Integrated multi-filter control center: Search input, **Category Filter Dropdown** (newly added to eliminate empty layout space), real-time status count pills, result counter, and reset button.
  - Compact tabular grid (`py-2.5`) with visual mini stock-depth progress bars comparing units in stock against reorder thresholds.

### 3. High-Performance Bulk CSV Data Ingestion (Admin-Exclusive)
- **Zero Disk Footprint (Ephemeral In-Memory Processing):**
  - Files are uploaded and parsed strictly in browser RAM using streaming RFC 4180 parsing, pre-flight validated, and dispatched as JSON payloads directly to Express `express.json()`.
  - Zero temporary files or disk storage used on either frontend or backend (file memory discarded immediately upon closing).
- **Admin-Exclusive Privilege:**
  - Both UI modal buttons and backend routes (`/api/products/bulk`, `/api/inventory/bulk-stock-in`, `/api/inventory/bulk-stock-out`) are guarded with `requireRole('ADMIN')`. Floor staff cannot access or execute bulk mutations (HTTP 403 Forbidden).
- **Option A (Strict All-or-Nothing Atomic Rollback):**
  - If any row in a CSV batch fails validation, has an unresolvable SKU, or has insufficient inventory during stock-out, the entire transaction is rolled back with zero database mutations and an itemized failure report.
- **Deadlock-Free Row-Level Locking:**
  - Batch operations acquire deterministic alphabetical row locks (`SELECT ... FOR UPDATE`) inside ACID transactions, preventing deadlocks under concurrent batch fulfillment.
- **Full User Attribution:**
  - Every batch created product, inventory ledger entry, and audit trail record is tagged with the active authenticated administrator's ID.
- **Glassmorphic Batch Import UI:**
  - Drag-and-drop dropzone, live table preview with valid/invalid status counters, error badges, and 1-click ready-made CSV template generation (`products`, `stock-in`, `stock-out`).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** `>= 20.0.0`
- **pnpm:** `>= 9.0.0` (or `npm`)
- **PostgreSQL:** `>= 16.0` (local instance or Docker container)

### 1. Installation
```bash
# Clone repository
git clone https://github.com/Ahmad-Codemaster/stockflow.git
cd stockflow

# Install dependencies
pnpm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

Required `.env` variables:
```ini
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/stockflow?schema=public"
SESSION_SECRET="stockflow-secure-random-session-secret-key-32-chars-min"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Database Initialization & Seeding
```bash
# Generate Prisma Client and apply migrations
npx prisma generate
npx prisma migrate deploy

# (Optional) Seed initial demo fixtures
npm run db:seed
```

### 4. Running the Application Locally
In separate terminals:
```bash
# Terminal 1: Start Express API Backend (Port 3001)
npm run server

# Terminal 2: Start Vite React Frontend (Port 5173)
npm run dev
```

Visit the application at **`http://localhost:5173`**.

---

## 🔑 Initial Administrator Account & Clean-Slate Setup

StockFlow is delivered in a **pristine clean-slate state** with zero demo items, suppliers, or transactions. All business data is added fresh through the UI.

The system is pre-configured with a root Administrator account:

| Account | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :---: | :--- |
| **System Admin** | `admin@stockflow.com` | `Admin@123` | `ADMIN` | Full catalog CRUD, user provisioning & role management, audit ledger, and store wipe utility |

> **Fresh Onboarding Flow:**
> 1. Log in with the Administrator account above.
> 2. Create your business categories under **Categories**.
> 3. Register your vendor partners under **Suppliers**.
> 4. Add your product catalog under **Products**.
> 5. Provision staff user accounts under **User Management** (`ADMIN` or `STAFF` roles).
> 6. Record inbound receipts (**Stock In**) and dispatches (**Stock Out**).

---

## 🧪 Testing & Verification Guide

StockFlow includes an extensive automated test suite covering unit logic, integration workflows, database concurrency, and security rules:

```bash
# Run all automated tests
npm run test

# Run tests in interactive watch mode
npm run test:watch

# Typecheck entire TypeScript codebase (zero errors)
npm run typecheck

# Build production bundle
npm run build
```

### Testing the 6 Core Hardening Priorities

| Priority | Test Command / Endpoint | Focus Area |
|---|---|---|
| **P1: Concurrency** | `npx vitest run tests/concurrency.test.ts` | 5 scenarios: Competing over-allocation, exact exhaustion, equal contention, transactional rollback, and 10 parallel requests. |
| **P2: Validation** | `npx vitest run tests/validation.test.ts` | Zod schema enforcement across bodies, route parameters, and query strings. |
| **P3: Integration / E2E** | `npx vitest run tests/lifecycle.test.ts tests/inventory.test.ts tests/products.test.ts` | Complete 8-step inventory lifecycle, status transitions (`In Stock` ↔ `Low Stock` ↔ `Out of Stock`), and SKU uniqueness. |
| **P4: Observability** | `curl -i http://localhost:3001/api/health/ready` | Live DB ping, query latency in ms, uptime, and memory usage. `X-Request-Id` in headers. |
| **P5: Security & RBAC** | `npx vitest run tests/rbac.test.ts` <br/> `npm audit --omit=dev` | Staff vs. Admin access enforcement (HTTP 403 on protected routes) and zero critical dependency vulnerabilities. |
| **P6: Operational Docs** | View [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) | Database migrations, Docker deploys, backup/restore (`pg_dump -Fc`), rollback, and incident recovery. |

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/login` | Public | Authenticate user, issue HttpOnly session cookie (rate limited) |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate session in database and clear cookie |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user session |
| `GET` | `/api/products` | Authenticated | List products with pagination, search, and category filters |
| `POST` | `/api/products` | Admin Only | Create product with unique SKU and initial stock transaction |
| `PUT` | `/api/products/:id` | Admin Only | Update product attributes (SKU remains immutable) |
| `DELETE` | `/api/products/:id` | Admin Only | Soft-delete / archive product |
| `POST` | `/api/inventory/stock-in` | Authenticated | Record inbound stock receipt (`SELECT ... FOR UPDATE`) |
| `POST` | `/api/inventory/stock-out` | Authenticated | Record outbound stock dispatch with negative stock checks |
| `POST` | `/api/inventory/adjust` | Admin Only | Reconcile physical inventory counts |
| `GET` | `/api/inventory/transactions` | Authenticated | Query immutable audit ledger of stock movements |
| `GET` | `/api/users` | Admin Only | List system users |
| `POST` | `/api/users` | Admin Only | Provision new user (`ADMIN` or `STAFF`) |
| `PUT` | `/api/users/:id/deactivate` | Admin Only | Deactivate user and revoke all active sessions (Last-Admin guarded) |
| `GET` | `/api/health/live` | Public | Liveness probe (Node event loop check) |
| `GET` | `/api/health/ready` | Public | Readiness probe (PostgreSQL ping, latency, memory) |
| `GET` | `/api/health` | Public | Operational health status probe |

---

## 📁 Repository Structure

```
stockflow/
├── docs/                       # Technical specifications & operational runbooks
│   ├── ARCHITECTURE.md         # Layering, boundaries & transactional model
│   ├── RUNBOOK.md              # Production runbook (Migrations, Deploys, Backups, Rollback)
│   ├── DEPLOYMENT.md           # Docker & Render cloud infrastructure guide
│   ├── DATABASE.md             # Relational ERD & table schemas
│   ├── API.md                  # RESTful API specifications & payload DTOs
│   ├── RBAC.md                 # Role-Based Access Control matrix
│   ├── BUSINESS_RULES.md       # Domain invariants & concurrency handling
│   ├── TEST_PLAN.md            # Test matrix & automated test specifications
│   └── PRODUCTION_READINESS_AUDIT.md # Security, resilience & production readiness audit
├── prisma/                     # Database schema & migrations
│   ├── schema.prisma           # Prisma 7-model relational schema
│   └── migrations/             # SQL migration files
├── server/                     # Express 5 backend service
│   ├── controllers/            # Route controllers
│   ├── middleware/             # Auth, RBAC, Zod validation, Rate limiter, Logger, Request ID
│   ├── routes/                 # Express REST route modules
│   ├── schemas/                # Zod DTO validation schemas
│   ├── services/               # Core domain logic & concurrency engine (SELECT ... FOR UPDATE)
│   ├── app.ts                  # Express application factory
│   ├── db.ts                   # Prisma client singleton
│   ├── logger.ts               # Structured JSON logger
│   └── seed.ts                 # Database seed script
├── src/                        # React 19 frontend application
│   ├── components/             # Layout, Sidebar, Header, UI primitives, Charts
│   ├── pages/                  # 15 screen views (Dashboard, Inventory, Products, etc.)
│   ├── context.tsx             # Application state management & API client integration
│   ├── index.css               # Tailwind CSS v4 tokens, ambient mesh & GPU animations
│   └── types.ts                # TypeScript domain models & UI interfaces
├── tests/                      # 14 automated test suites (Vitest + Supertest)
│   ├── concurrency.test.ts     # Row-level locking & race condition tests
│   ├── validation.test.ts      # Zod input validation tests
│   ├── lifecycle.test.ts       # End-to-end inventory lifecycle test
│   ├── inventory.test.ts       # Stock-in/out & status transition tests
│   ├── products.test.ts        # SKU uniqueness & archival tests
│   ├── rbac.test.ts            # Role-based access control tests
│   └── auth.test.ts            # Authentication & session tests
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline (Postgres, lint, test, build)
├── Dockerfile                  # Production container definition
├── render.yaml                 # Render Blueprint specification
├── package.json                # Scripts & runtime dependencies
├── tsconfig.json               # TypeScript strict configuration
└── vite.config.ts              # Vite 8 configuration with React & Tailwind
```

---

## 📜 License

Private and proprietary. Designed and maintained for enterprise inventory and operations management.
