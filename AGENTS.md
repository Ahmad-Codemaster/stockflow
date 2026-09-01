# StockFlow — Operational Agent Manual & Engineering Standards

> **Document Type:** AI Coding Agent Operational Guide  
> **Target Repository:** `stockflow` (Inventory and Operations Management System)  
> **Status:** AUDITED / READY FOR BACKEND & PERSISTENCE IMPLEMENTATION  
> **Baseline:** React 19 + TypeScript + Vite + Tailwind CSS v4  

---

## 1. Project Overview

**StockFlow** is an enterprise inventory and operations management system designed for small-to-medium businesses. It provides reliable catalog management, multi-supplier tracking, real-time inventory monitoring, strict stock-in/stock-out workflows, role-based access control (Admin vs. Staff), and operational reporting.

The repository originated from a Figma Make exported frontend prototype. The UI design, component hierarchy, and design token system are established and high quality, but all backend persistence, database storage, server-side authorization, transactional integrity, and automated testing are currently missing or simulated with in-memory mock data.

---

## 2. Current Architecture (As Discovered)

```
[Browser / React 19 SPA Shell]
       │
       ├── App.tsx (State-based Page Switcher / Router)
       │     ├── Layout (Sidebar + Header + Breadcrumb)
       │     └── Page Components (15 View Screens)
       │
       ├── context.tsx (In-Memory Monolithic React Context)
       │     ├── State: products, categories, suppliers, inventory, transactions, users, notifications, toasts
       │     └── Handlers: Direct array mutations & simulated setTimeout delays
       │
       └── data.ts (Static Seed Data Fixtures)
```

* **Frontend Framework:** React 19 (`react`, `react-dom` v19.0.0)
* **Build Tooling:** Vite 8.0.5 with `@vitejs/plugin-react` and `@tailwindcss/vite`
* **Styling System:** Tailwind CSS v4 (`@import 'tailwindcss';` with `@theme` CSS custom properties in `src/index.css`)
* **Icons:** `lucide-react` v1.37.0
* **Language & Types:** TypeScript 5.7 (Strict mode enabled, `@/*` path alias mapped to `./src/*`)
* **Routing:** **Manual In-Memory State Switcher** (`currentPage: Page` inside `context.tsx`). *No React Router, TanStack Router, or URL hash routing exists.*
* **State Management:** Single React Context (`AppContext` in `src/context.tsx`) holding all entities in JavaScript memory.
* **Data Persistence:** **None.** All changes reset upon browser reload.
* **Backend / API / Database:** **None.** No server, API routes, ORM, or database exists in the current repo.
* **Testing / CI:** **None.** No test runners (Vitest/Jest/Playwright) or CI workflow files exist.

---

## 3. Technology Stack & Planned Evolution

| Layer | Current Status (Audited) | Planned Target Architecture |
| :--- | :--- | :--- |
| **Frontend Shell** | React 19 + TypeScript 5.7 | React 19 + TypeScript 5.7 (Preserve UI) |
| **Styling** | Tailwind CSS v4 + `@theme` tokens | Tailwind CSS v4 (Preserved) |
| **Icons** | `lucide-react` | `lucide-react` |
| **Routing** | In-memory `currentPage` state | Browser URL routing (React Router v7 / TanStack Router) |
| **API Client** | In-memory synchronous function calls | Type-safe API Client (Fetch / TanStack Query) |
| **Backend API** | *None* | Node.js (Fastify / Express / Hono) or Next.js / Vite Server Endpoints |
| **Database & ORM**| *None* (In-memory arrays) | PostgreSQL / SQLite with Prisma ORM or Drizzle ORM |
| **Auth & Sessions**| Mock email lookup (Password ignored) | Argon2/Bcrypt password hashing + Secure HTTP-only JWT Sessions |
| **Transactions** | Array pushes in React state | ACID SQL Transactions with `SELECT ... FOR UPDATE` row locks |
| **Testing** | *None* | Vitest + React Testing Library + Playwright E2E |
| **CI / DevOps** | *None* | GitHub Actions (Lint, Typecheck, Test, Build) + Docker |

---

## 4. Directory Structure

```
stockflow/
├── .figma/                     # Figma Make export metadata
├── docs/                       # Comprehensive engineering audit & technical specifications
│   ├── ARCHITECTURE.md         # Current vs Target architectural specification
│   ├── DATABASE.md             # Proposed relational schema & SQL migrations
│   ├── API.md                  # RESTful API contracts & endpoint specifications
│   ├── RBAC.md                 # Role-Based Access Control matrix & enforcement rules
│   ├── BUSINESS_RULES.md       # Domain invariants, transaction rules & edge cases
│   ├── TEST_PLAN.md            # Test matrix, unit/integration/E2E test specifications
│   ├── DEPLOYMENT.md           # Production hosting, Docker & CI/CD deployment guide
│   ├── IMPLEMENTATION_PLAN.md  # Prioritized task roadmap (P0-P3, 20-30 hr budget)
│   ├── UI_AUDIT.md             # Screen-by-screen UX, responsive & a11y forensic audit
│   ├── SECURITY_AUDIT.md       # Vulnerability report & threat remediation guide
│   ├── PROJECT_STATUS.md       # High-level project status & completion tracking
│   ├── REQUIREMENTS_TRACEABILITY.md # End-to-end traceability matrix
│   └── AUDIT_REPORT.md         # Executive scorecard & audit summary
├── src/
│   ├── components/             # Reusable UI & layout components
│   │   ├── Header.tsx          # Top bar, breadcrumbs, search dropdown, notifications
│   │   ├── Layout.tsx          # Sidebar + Header + Content grid container
│   │   ├── Modal.tsx           # Accessible modal container with ESC listener
│   │   ├── Sidebar.tsx         # Left navigation bar with role-conditional Admin section
│   │   ├── Toast.tsx           # Floating toast notification system
│   │   └── ui.tsx              # Design system primitives (Badge, KPICard, Pagination, Confirm, etc.)
│   ├── pages/                  # Screen views (15 screens)
│   │   ├── Categories.tsx      # Category management CRUD
│   │   ├── Dashboard.tsx       # KPI metrics, stock distribution bar, recent activity
│   │   ├── Inventory.tsx       # Central inventory monitoring & stock level filters
│   │   ├── Login.tsx           # Authentication view & credentials form
│   │   ├── ProductDetail.tsx   # Detailed product view, stock analytics & txn history
│   │   ├── ProductForm.tsx     # Add / Edit product form with SKU & pricing validation
│   │   ├── Products.tsx        # Product catalog table with search, filter, sort, pagination
│   │   ├── Reports.tsx         # Multi-tab reporting (Summary, Movement, Low Stock, Valuation)
│   │   ├── Settings.tsx        # Profile, password reset, theme & notification settings
│   │   ├── StockIn.tsx         # Stock-In receiving transaction workflow
│   │   ├── StockOut.tsx        # Stock-Out fulfillment transaction workflow (with stock checks)
│   │   ├── Suppliers.tsx       # Supplier directory CRUD
│   │   ├── TransactionDetail.tsx # Immutable transaction audit record view
│   │   ├── Transactions.tsx    # Global stock movement ledger table
│   │   └── Users.tsx           # Admin-only user management & role provisioning
│   ├── App.tsx                 # Root component & page router dispatcher
│   ├── context.tsx             # [CURRENT] Monolithic in-memory React state context
│   ├── data.ts                 # [CURRENT] Initial mock fixtures (Users, Products, etc.)
│   ├── index.css               # Tailwind CSS v4 theme variables & base typography
│   ├── main.tsx                # React DOM root entrypoint
│   └── types.ts                # TypeScript domain models and UI types
├── AGENTS.md                   # This instruction manual
├── package.json                # Project scripts & runtime dependencies
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration with React and Tailwind plugins
```

---

## 5. Coding Standards & Conventions

### 5.1 Naming Conventions
* **Components & Pages:** PascalCase (`ProductDetail.tsx`, `KPICard.tsx`).
* **Hooks & Utilities:** camelCase (`useApp.ts`, `formatCurrency.ts`).
* **Constants & Enums:** UPPER_SNAKE_CASE (`PAGE_SIZE`, `MAX_STOCK_LIMIT`).
* **Types & Interfaces:** PascalCase (`Product`, `StockTransaction`, `UserRole`).
* **Database Tables & Columns (Target):** snake_case (`stock_transactions`, `reorder_level`).

### 5.2 TypeScript Conventions
* **Strict Typing:** No implicit `any`. Strict null checks are strictly enforced by `tsconfig.json`.
* **Export Types:** Keep domain interfaces in `src/types.ts` or feature-specific type modules.
* **Component Props:** Declare explicit `interface Props` above every functional component.
* **Avoid Non-Null Assertions:** Never use `!` unless guaranteed by preceding invariant checks.

### 5.3 Component Architecture
* **Export Defaults:** Follow the existing project pattern where page and layout components are exported as default exports (`export default function Products()`).
* **Design System Primitives:** Reuse existing components in `src/components/ui.tsx` (`Badge`, `KPICard`, `EmptyState`, `Confirm`, `FormField`, `Pagination`, `PageHeader`, `inputClass`, `selectClass`). Do not invent new ad-hoc styles when primitives exist.
* **String Literals:** Use double quotes for strings with apostrophes (`"Don't have an account"`) or escape them properly.

### 5.4 Error Handling & Feedback
* **User-Facing Errors:** Always provide actionable feedback via inline form errors or the `showToast('error', message)` notification system.
* **Async Operations:** Wrap backend calls in `try/catch/finally` blocks, manage loading states (`saving`, `submitting`), and disable submit buttons during in-flight requests.

---

## 6. Architecture & Layering Rules

When implementing the backend, database, and client-server communication, future AI agents **MUST** respect the following layer boundaries:

```
[UI Layer (React Pages & Components)]
       │ (Calls UI hooks & actions)
[State / Data-Fetching Layer (TanStack Query / Context)]
       │ (HTTP Requests with Authorization Header)
[API / Controller Layer (REST Endpoints / Route Handlers)]
       │ (Validates DTOs, extracts authenticated session)
[Domain / Service Layer (Business Logic & Inventory Rules)]
       │ (Manages ACID transactions, prevents race conditions)
[Data Access / ORM Layer (Prisma / Drizzle / SQL)]
       │ (Executes parameterized queries with Row-Level Locks)
[Relational Database (PostgreSQL / SQLite)]
```

* **No direct database queries from UI components.**
* **No business logic in route controllers.** Validation and orchestration belong in dedicated service modules.
* **Client-side validation is for UX only.** Every constraint (non-negative stock, SKU uniqueness, role permissions) **MUST** be re-validated on the server.

---

## 7. Database & Domain Integrity Rules

1. **Foreign Key Integrity:**
   * A product must reference a valid `categoryId`.
   * A product may optionally reference a `supplierId` (`ON DELETE SET NULL`).
   * A `stock_transaction` must reference a valid `productId` and `userId`.
2. **SKU Uniqueness:**
   * `sku` column in `products` must have a unique database constraint (`UNIQUE INDEX`).
3. **Immutability of Audit Trails:**
   * `stock_transactions` and `audit_logs` are strictly **append-only**.
   * No `UPDATE` or `DELETE` endpoints or operations may be exposed for transaction records.
4. **Soft Deletes / Archival:**
   * Products, Categories, and Suppliers should support soft deletion (`is_archived` / `deleted_at`) to preserve relational integrity with historical transactions.

---

## 8. Critical Inventory Business Rules

### 8.1 Transactional Atomicity
Every inventory movement (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`) **MUST** execute inside an atomic database transaction:
1. Verify product existence and lock the product row (`SELECT ... FOR UPDATE`).
2. Validate that the operation will not violate constraints (e.g., stock cannot become negative).
3. Update the product's `quantity` column.
4. Insert the immutable `stock_transactions` record containing `previous_stock`, `quantity`, `new_stock`, `performed_by_id`, `reference`, and `notes`.
5. Commit transaction. If any step fails, **ROLL BACK ALL CHANGES**.

### 8.2 Stock-Out Negative Prevention
* **Invariable Rule:** `currentStock - quantity >= 0`.
* If a requested stock-out exceeds available stock:
  * The operation **MUST** abort immediately.
  * Server responds with HTTP `400 Bad Request` or `422 Unprocessable Entity`: `"Insufficient stock. Only X units are available."`
  * No partial deduction and no database record creation allowed.

### 8.3 Concurrency Control (Race Condition Prevention)
* To prevent race conditions where two simultaneous stock-out requests over-deduct inventory:
  * Use **Pessimistic Row-Level Locking** (`SELECT quantity FROM products WHERE id = $id FOR UPDATE`) within the SQL transaction, OR
  * Use **Atomic Conditional Updates**:
    ```sql
    UPDATE products
    SET quantity = quantity - $qty, updated_at = NOW()
    WHERE id = $id AND quantity >= $qty;
    ```
    Verify that exactly 1 row was updated. If 0 rows updated, raise an insufficient stock exception and rollback.

### 8.4 Dynamic Product Stock Status
Product stock status is strictly computed from inventory metrics:
* `quantity > reorderLevel` $\rightarrow$ `IN_STOCK` (`'In Stock'`)
* `quantity > 0 AND quantity <= reorderLevel` $\rightarrow$ `LOW_STOCK` (`'Low Stock'`)
* `quantity == 0` $\rightarrow$ `OUT_OF_STOCK` (`'Out of Stock'`)

---

## 9. Role-Based Access Control (RBAC) Rules

### 9.1 Roles & Capabilities Matrix

| Capability / Resource | ADMIN | STAFF | Enforcement Level |
| :--- | :---: | :---: | :--- |
| Login / Logout / Change Own Password | ✅ | ✅ | Client + Server Auth |
| View Dashboard & KPI Metrics | ✅ | ✅ | Client + Server RBAC |
| View Products Catalog & Search | ✅ | ✅ | Client + Server RBAC |
| Create / Edit / Archive Products | ✅ | ❌ | Client UI + Server Route Guard |
| Manage Categories (CRUD) | ✅ | ❌ | Client UI + Server Route Guard |
| Manage Suppliers (CRUD) | ✅ | ❌ | Client UI + Server Route Guard |
| View Inventory Levels | ✅ | ✅ | Client + Server RBAC |
| Record Stock In / Stock Out | ✅ | ✅ | Client + Server RBAC |
| View Transactions History & Details | ✅ | ✅ | Client + Server RBAC |
| View Inventory & Movement Reports | ✅ | ✅ | Client + Server RBAC |
| View User Management List | ✅ | ❌ | Client UI + Server Route Guard |
| Create / Edit Users & Provision Roles | ✅ | ❌ | Client UI + Server Route Guard |
| Deactivate / Reactivate User Accounts | ✅ | ❌ | Client UI + Server Route Guard |
| View System Audit Logs | ✅ | ❌ | Client UI + Server Route Guard |

### 9.2 Security Invariant
* **UI Hiding is NOT Security.**
* Every protected API endpoint must verify the incoming session/token and validate `user.role === 'ADMIN'`. Unauthorized requests must return HTTP `403 Forbidden`.

---

## 10. Security & Secrets Rules

1. **Zero Hardcoded Secrets:** Never hardcode API keys, database credentials, JWT secrets, or encryption keys in source code or commits.
2. **Environment Variables:** Use `.env.example` to document required variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`). Keep `.env` in `.gitignore`.
3. **Password Security:** Passwords must be hashed using `argon2id` or `bcrypt` (work factor $\ge 12$). Never store or log plaintext passwords.
4. **Session Cookies:** Store JWTs / session tokens in `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookies.
5. **Input Sanitization:** Validate and sanitize all string inputs against SQL injection and XSS using validation schemas (Zod).

---

## 11. Testing & Quality Assurance Rules

Every future feature and refactoring phase must maintain automated test coverage:

1. **Mandatory Test Scenarios:**
   * Admin can create, edit, and archive products.
   * Staff is rejected (HTTP 403) when attempting to access user management or create products.
   * Duplicate SKU creation is rejected with a descriptive error.
   * Stock-In increases inventory and creates an immutable transaction record atomically.
   * Stock-Out decreases inventory and creates a transaction record atomically.
   * Stock-Out fails when requested quantity exceeds available stock; zero database mutation occurs.
   * Concurrent stock-outs do not result in negative inventory or race conditions.
   * Deactivated users cannot log in.
   * Product status correctly transitions across `IN_STOCK`, `LOW_STOCK`, and `OUT_OF_STOCK`.
2. **Testing Stack:**
   * Unit & Integration Tests: `vitest`, `@testing-library/react`, `@testing-library/user-event`.
   * End-to-End Tests: `@playwright/test`.

---

## 12. Git & AI Coding Rules

### 12.1 Git Cleanliness
* Never commit `.env`, `.env.local`, `node_modules`, `dist`, `build`, or temporary log files.
* Write atomic, descriptive commit messages in conventional commit format (`feat: implement atomic stock-out endpoint`, `test: add concurrency race condition test`).

### 12.2 Rules for AI Coding Agents
* **Inspect Before Modifying:** Always read target files and check existing design primitives in `src/components/ui.tsx` before adding code.
* **Preserve Visual Polish:** Do not break the clean Figma styling, color palette, or typography tokens in `src/index.css`.
* **Avoid Unnecessary Dependencies:** Only install production-grade, vetted libraries strictly required for the feature (e.g., `zod`, `vitest`, `@prisma/client` or `better-sqlite3`).
* **Never Bypass Business Rules:** Never disable validations or authorization checks merely to pass a test.
* **Keep Implementation Scope Achievable:** Target completion within the allocated 20–30 hour project roadmap.

---

## 13. Project Definition of Done (DoD)

A milestone or full release is considered **DONE** only when:
* [x] **Audit & Architecture Specs:** Comprehensive forensic audit and technical specs created in `docs/`.
* [ ] **Working Application:** Complete full-stack inventory application running smoothly without uncaught console errors.
* [ ] **Data Persistence:** Real database persistence with relational integrity and soft deletion.
* [ ] **Transactional Stock Operations:** Atomic Stock-In and Stock-Out with row locking and zero negative stock possibility.
* [ ] **True Authentication & RBAC:** Secure password hashing, HTTP-only sessions, and server-enforced role authorization.
* [ ] **Automated Test Suite:** Unit, integration, and E2E tests passing with $\ge 85\%$ core business logic coverage.
* [ ] **CI Pipeline:** GitHub Actions workflow executing linting, TypeScript typecheck, tests, and build on all branches.
* [ ] **Deployment:** Live staging/production deployment URL with environment configuration.
* [ ] **Documentation & Build Log:** Complete README, architecture documentation, and AI usage transparency log.
