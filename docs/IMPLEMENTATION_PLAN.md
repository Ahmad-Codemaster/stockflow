# StockFlow — Implementation Roadmap & Engineering Work Breakdown

> **Document Version:** 1.0.0  
> **Status:** ROADMAP & PROJECT MANAGEMENT PLAN  
> **Total Budgeted Effort:** 25–30 Engineering Hours  
> **Target Delivery:** Production-Grade MVP  

---

## 1. Milestone Roadmap Overview

```
Milestone 1: Setup & Client Routing (2.5h)
    │
    ▼
Milestone 2: Database Schema & ORM Setup (3.0h)
    │
    ▼
Milestone 3: Authentication & Server RBAC (3.5h)
    │
    ▼
Milestone 4: Catalog, Categories & Suppliers (4.0h)
    │
    ▼
Milestone 5: Atomic Inventory Transactions (4.5h)
    │
    ▼
Milestone 6: Dashboard Metrics & Reports (3.0h)
    │
    ▼
Milestone 7: Comprehensive Automated Testing (4.0h)
    │
    ▼
Milestone 8: CI/CD, Docker & Production Deploy (2.5h)
    │
    ▼
Milestone 9: Documentation & Build Log (2.0h)
────────────────────────────────────────────────────
Total Estimated Effort: 29.0 Hours
```

---

## 2. Detailed Task Breakdown & Work Packages

### Milestone 1: Setup, Client Routing & Architecture Foundation (2.5h)
* **Goal:** Establish proper client-side routing, query client, and test harness without breaking existing UI.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `SET-001` | **P0** | Install & Configure Browser Routing (React Router v7 / TanStack Router) | None | URLs update on page switch; back/forward buttons work; bookmarks reload correctly. | 1.0h | Low |
| `SET-002` | **P0** | Install & Setup Vitest + Testing Library | None | `pnpm test` runs and passes smoke test suite. | 0.5h | Low |
| `SET-003` | **P1** | Setup TanStack Query for Server State Management | `SET-001` | Query client configured with centralized error handling and toast triggers. | 1.0h | Low |

---

### Milestone 2: Relational Database, Schema & Migrations (3.0h)
* **Goal:** Provision database models, constraints, unique indexes, and seed fixtures.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `DB-001` | **P0** | Setup PostgreSQL Database & ORM (Prisma / Drizzle) | `SET-001` | Database connection established; schema defined in schema file. | 1.0h | Low |
| `DB-002` | **P0** | Implement Relational Migration Script | `DB-001` | Tables created with `CHECK(quantity >= 0)`, `CHECK(price >= 0)`, unique SKU index, FKs. | 1.0h | Med |
| `DB-003` | **P1** | Create Database Seeder with Initial Mock Catalog | `DB-002` | `pnpm db:seed` provisions initial users, categories, suppliers, and products. | 1.0h | Low |

---

### Milestone 3: Authentication, Session Management & Server RBAC (3.5h)
* **Goal:** Replace mock login with Argon2id password verification, HTTP-only JWT cookies, and role middleware.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `AUT-001` | **P0** | Implement Backend Auth API (`/login`, `/logout`, `/me`) | `DB-002` | Passwords securely hashed; HTTP-only cookie issued on login; cleared on logout. | 1.5h | Med |
| `AUT-002` | **P0** | Implement Server-Side RBAC Middleware (`requireRole`) | `AUT-001` | Unauthorized requests return 401; non-admin users blocked from admin routes with 403. | 1.0h | Low |
| `AUT-003` | **P1** | Connect React Login & Header to Live Auth API | `AUT-001` | Real authentication flow active; invalid credentials show error; deactivated users blocked. | 1.0h | Low |

---

### Milestone 4: Catalog, Category & Supplier Backend & UI Integration (4.0h)
* **Goal:** Enable persistent CRUD operations for products, categories, and suppliers with soft deletion.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `CAT-001` | **P0** | Products CRUD API with Server-Side Pagination & Filters | `DB-002`, `AUT-002` | Products list supports search, category filter, status filter, and pagination. | 1.5h | Low |
| `CAT-002` | **P0** | Categories & Suppliers CRUD API | `DB-002`, `AUT-002` | Create, Edit, and Soft-Delete work; duplicate category names rejected. | 1.0h | Low |
| `CAT-003` | **P1** | Connect Frontend Products, Categories, Suppliers UI to API | `CAT-001`, `CAT-002` | Data persists across reloads; forms use TanStack Query mutations with toast feedback. | 1.5h | Low |

---

### Milestone 5: Atomic Inventory Transactions (4.5h)
* **Goal:** Implement transactional Stock-In and Stock-Out with row locking, atomic updates, and negative stock prevention.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `INV-001` | **P0** | Implement Atomic Stock-In Endpoint | `DB-002`, `AUT-002` | Increases product quantity and creates immutable transaction record inside SQL transaction. | 1.5h | Med |
| `INV-002` | **P0** | Implement Atomic Stock-Out Endpoint with Row Locking | `DB-002`, `AUT-002` | Locks product row (`FOR UPDATE`), prevents negative stock, updates quantity, creates transaction record. | 2.0h | High |
| `INV-003` | **P1** | Connect Stock-In and Stock-Out UI Forms to Live API | `INV-001`, `INV-002` | Real-time stock previews update correctly; insufficient stock errors rendered gracefully. | 1.0h | Low |

---

### Milestone 6: Dashboard Aggregations, Metrics & Operational Reports (3.0h)
* **Goal:** Replace client-side array reduces with optimized database aggregation queries for reports and KPIs.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `REP-001` | **P1** | Implement Aggregated Summary KPI API (`/reports/summary`) | `INV-001` | Returns total products, stock units, valuation, low-stock count, and out-of-stock count. | 1.5h | Low |
| `REP-002` | **P1** | Implement Stock Movement & Valuation Reports API | `INV-001` | Returns time-series and per-product stock movements and valuation breakdowns. | 1.0h | Low |
| `REP-003` | **P1** | Connect Dashboard & Reports UI to Live Aggregations | `REP-001`, `REP-002` | Charts, progress bars, and breakdown tables populate with real database metrics. | 0.5h | Low |

---

### Milestone 7: Automated Test Suite (4.0h)
* **Goal:** Achieve $\ge 85\%$ test coverage across business invariants, RBAC, and concurrency.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `TST-001` | **P0** | Implement 10 Critical Business Unit & Integration Tests | All Milestones | All 10 mandatory business test scenarios pass cleanly in Vitest. | 2.0h | Med |
| `TST-002` | **P0** | Implement Concurrency & Race Condition Test Suite | `INV-002` | Concurrent stock-out simulation confirms zero negative stock and zero race conditions. | 1.0h | High |
| `TST-003` | **P1** | Implement Playwright E2E Smoke Tests | All Milestones | Full user flow (Login -> Add Product -> Stock In -> Stock Out -> View Report) verified. | 1.0h | Med |

---

### Milestone 8: CI/CD, Docker & Production Deployment (2.5h)
* **Goal:** Automated GitHub Actions pipeline and live deployed application with PostgreSQL.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `OPS-001` | **P0** | Setup Multi-Stage Dockerfile & Local Compose | `SET-001` | `docker build` succeeds; app runs with database in Docker. | 1.0h | Low |
| `OPS-002` | **P0** | Create GitHub Actions CI Workflow | `TST-001` | CI runs lint, typecheck, unit tests, and production build on pull request. | 0.5h | Low |
| `OPS-003` | **P0** | Deploy Live Application to Cloud Host (Vercel/Render) | `OPS-001` | Live public URL accessible with active SSL and PostgreSQL database. | 1.0h | Med |

---

### Milestone 9: Documentation, Build Log & Final Polish (2.0h)
* **Goal:** Finalize README, produce AI usage build log, and prepare 3–5 minute evaluation demo.

| Task ID | Priority | Task Description | Dependencies | Acceptance Criteria | Est. Time | Risk |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `DOC-001` | **P1** | Update Root README.md with Full Setup & Run Guide | All Milestones | Clear step-by-step local execution and environment documentation. | 1.0h | Low |
| `DOC-002` | **P1** | Produce Build Log with Transparent AI Usage Record | All Milestones | Documents AI prompts, modifications, test validations, and architectural decisions. | 1.0h | Low |

---

## 3. Prioritization Matrix Summary

* **P0 (Must Fix / Core Deliverable):** 18.0 Hours
* **P1 (Required for Definition of Done):** 11.0 Hours
* **P2 / P3 (Enhancements & Polish):** Deferred to post-MVP phase.
