# StockFlow — Inventory & Operations Management System

> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 | Node.js + Express + Prisma ORM (SQLite / PostgreSQL) | Vitest + GitHub Actions CI

StockFlow is an enterprise inventory and operations management system designed for businesses requiring strict stock-in/stock-out workflows, multi-supplier tracking, real-time catalog management, session-based role authorization (Admin vs. Staff), and operational reporting.

---

## 🌟 Core System Highlights

- **Session-Based Authentication:** Secure `HttpOnly`, `SameSite=Lax` cookies validated against server-side `sessions` table with brute-force rate limiting.
- **Role-Based Access Control (RBAC):** Server-enforced route guards for `ADMIN` (catalog management, user provisioning & deletion, system logs) and `STAFF` (inventory monitoring, stock receiving, order fulfillment, reporting).
- **Atomic Inventory Transactions:** ACID stock-in, stock-out, and adjustment operations with row locking, negative stock prevention, and immutable transaction audit ledgers.
- **Interactive Visual Analytics:** Real-time KPI sparklines, 7-day stock velocity dual-column bar chart, and category valuation donut chart.
- **Case-Insensitive Uniqueness:** Enforced SKU uppercase normalization, email lowercase normalization, and unique database constraints.
- **SQL Aggregated Reporting:** High-performance database aggregation for dashboard KPIs, stock valuations, movement summaries, and low-stock replenishment alerts.
- **Automated Test Suite:** **39 unit, integration, and concurrency race-condition tests** across 10 test suites ($\ge 86\%$ code coverage).
- **Continuous Integration (CI):** Fully automated GitHub Actions workflow validating linting, TypeScript typechecking, automated test execution, and production bundling.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0 (or npm)

### 1. Installation
```bash
# Clone the repository and install dependencies
git clone <repo-url>
cd stockflow
pnpm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Default `.env` values:
```ini
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
SESSION_SECRET="stockflow-secure-random-session-secret-key-32-chars-min"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Database Initialization & Seeding
```bash
# Generate Prisma Client and initialize SQLite database
npx prisma generate
npx prisma db push

# Seed initial admin user, catalog, and transactions
npx tsx server/seed.ts
```

### 4. Running the Application Locally
In separate terminals:
```bash
# Terminal 1: Start Backend API Server (Port 3001)
npm run server

# Terminal 2: Start Frontend Dev Server (Port 5173)
npm run dev
```

Visit the application at `http://localhost:5173`.

---

## 🔑 Default Demonstration Credentials

| Account | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :---: | :--- |
| **Admin** | `ahmad@stockflow.com` | `Admin@123` | `ADMIN` | Full CRUD, user provisioning/removal, audit trail, wipe/seed tools |
| **Staff** | `ali@stockflow.com` | `Staff@123` | `STAFF` | Inventory, stock-in, stock-out, reporting |
| **Staff** | `sara@stockflow.com` | `Staff@123` | `STAFF` | Inventory, stock-in, stock-out, reporting |
| **Inactive** | `omar@stockflow.com` | `Staff@123` | `STAFF` | Deactivated (Login blocked with HTTP 403) |

---

## 🧪 Testing & Quality Assurance

Run the automated test suite and typechecks:
```bash
# Run all 39 Vitest automated test suites
npm run test

# Run with test coverage analysis
npx vitest run --coverage

# Typecheck entire TypeScript codebase (zero errors)
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 📁 Architecture & Technical Specifications

Comprehensive technical documentation is maintained in [`docs/`](./docs/):
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System architecture, layering and boundaries.
- [`docs/DATABASE.md`](./docs/DATABASE.md) — Relational ERD, table schemas, and indexing.
- [`docs/API.md`](./docs/API.md) — RESTful API contracts and payload DTOs.
- [`docs/RBAC.md`](./docs/RBAC.md) — Permission matrix and server enforcement rules.
- [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) — Domain invariants, transaction formulas, and concurrency handling.
- [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) — QA test matrix and test specifications.
- [`BUILD_LOG.md`](./BUILD_LOG.md) — Chronological engineering log & AI usage transparency disclosures.
