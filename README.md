# StockFlow — Inventory & Operations Management System

> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 | Node.js + Express + Prisma ORM (PostgreSQL) | Docker + Render | Vitest + GitHub Actions CI

StockFlow is an enterprise inventory and operations management system designed for businesses requiring strict stock-in/stock-out workflows, multi-supplier tracking, real-time catalog management, session-based role authorization (Admin vs. Staff), and operational reporting.

---

## 🌐 Live Deployment & Repository

| Resource | Link / Details |
| :--- | :--- |
| **GitHub Repository** | [https://github.com/Ahmad-Codemaster/stockflow](https://github.com/Ahmad-Codemaster/stockflow) |
| **Live Production URL** | Deployed on Render with Docker & Managed PostgreSQL |
| **Default Administrator** | Email: `admin@stockflow.com` \| Password: `Admin@123` |
| **Engineering Build Log** | [`BUILD_LOG.md`](./BUILD_LOG.md) (Chronological phases & architecture) |
| **AI Usage Disclosure** | [`AI_USAGE.md`](./AI_USAGE.md) (Toolchain, prompt engineering & methodology) |

---

## 🌟 Core System Highlights

- **Permanent Cloud Persistence:** Powered by managed PostgreSQL on Render with zero ephemeral data loss.
- **Session-Based Authentication:** Secure `HttpOnly`, `SameSite=Lax` cookies validated against server-side `sessions` table with brute-force rate limiting.
- **Role-Based Access Control (RBAC):** Server-enforced route guards for `ADMIN` (catalog management, user provisioning & deletion, system logs) and `STAFF` (inventory monitoring, stock receiving, order fulfillment, reporting).
- **Last-Admin Protection:** Atomic guards preventing deletion, demotion, or deactivation of the last remaining administrator account.
- **Atomic Inventory Transactions:** ACID stock-in, stock-out, and adjustment operations with row locking, negative stock prevention, and immutable transaction audit ledgers.
- **Interactive Visual Analytics:** Real-time KPI sparklines, 7-day stock velocity dual-column bar chart, and category valuation donut chart.
- **Built-in System Manual:** Interactive operational guide modal directly accessible from the Operations Dashboard.
- **Automated Test Suite:** **55 unit, integration, frontend component, and concurrency race-condition tests** across 14 test suites ($\ge 86\%$ code coverage).
- **Continuous Integration (CI):** Fully automated GitHub Actions workflow validating linting, TypeScript typechecking, automated test execution with PostgreSQL container, and production bundling.

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

### 3. Database Initialization
```bash
# Generate Prisma Client and initialize SQLite schema
npx prisma generate
npx prisma db push
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

## 🔑 Initial Administrator Account & Clean-Slate Setup

StockFlow is delivered in a **pristine clean-slate state** with zero demo catalog items, suppliers, or transactions. All business data is added fresh through the UI.

The system is pre-configured with a root Administrator account:

| Account | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :---: | :--- |
| **System Admin** | `admin@stockflow.com` | `Admin@123` | `ADMIN` | Full CRUD, user provisioning & role management, audit ledger, and store wipe utility |

> **Fresh Onboarding Flow:**
> 1. Log in with the Administrator account above.
> 2. Create your business categories under **Categories**.
> 3. Register your vendor partners under **Suppliers**.
> 4. Add your product SKUs under **Products**.
> 5. Provision staff user accounts under **User Management** (`ADMIN` or `STAFF` roles).

---

## 🧪 Testing & Quality Assurance

StockFlow features automated test coverage spanning backend REST APIs, atomic transaction invariants, high-concurrency race conditions, and React frontend components:

```bash
# Run all 54 Vitest automated tests across 14 suites
npm run test

# Run with test coverage analysis
npx vitest run --coverage

# Typecheck entire TypeScript codebase (zero errors)
npm run typecheck

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
- [`BUILD_LOG.md`](./BUILD_LOG.md) — Chronological engineering log & architecture traceability.
- [`AI_USAGE.md`](./AI_USAGE.md) — AI toolchain, prompt engineering, and methodology disclosures.
