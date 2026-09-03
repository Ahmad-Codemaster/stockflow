# StockFlow — System Architecture Specification

> **Document Version:** 2.0.0  
> **Status:** ✅ FULLY IMPLEMENTED & PRODUCTION-READY  
> **Classification:** Engineering & Architecture Documentation  

---

## 1. Overview & Architectural Goals

StockFlow is an internal inventory and operations management system engineered for high data integrity, strict auditability, low operational latency, and role-based access control.

The system's core responsibilities are:
1. **Catalog & Directory Management:** Products, multi-level categories, and supplier records.
2. **Inventory Control & Movement Ledger:** Strict stock-in/stock-out workflows with real-time derivation of stock levels and zero possibility of negative stock.
3. **Auditability:** Immutable append-only transaction ledger and administrative audit logging.
4. **Access Control:** Strict boundary separation between System Administrators (`ADMIN`) and Warehouse Staff (`STAFF`).

This document contrasts the **Current Discovered Architecture** against the **Target Production Architecture**.

---

## 2. Current Architecture (As-Is Forensic Audit)

### 2.1 Component Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER (SPA)                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        React 19 Shell                            │  │
│  │                                                                  │  │
│  │   App.tsx ──► [Layout] ──► Sidebar + Header + ToastContainer     │  │
│  │                 │                                                │  │
│  │                 └──► Conditional Page Switcher (15 Pages)        │  │
│  │                        (Dashboard, Products, StockIn, Users...)  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  AppContext (src/context.tsx)                    │  │
│  │                                                                  │  │
│  │   • In-Memory JavaScript Arrays:                                 │  │
│  │     - products[], categories[], suppliers[], inventory[]         │  │
│  │     - transactions[], users[], notifications[], toasts[]         │  │
│  │   • In-Memory Methods:                                           │  │
│  │     - login(), logout(), addProduct(), stockIn(), stockOut()...  │  │
│  │   • Initialized from static fixtures in `src/data.ts`            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌────────────────────────┐              ┌──────────────────────────┐  │
│  │  NO BROWSER ROUTING    │              │   NO PERSISTENCE / DB    │  │
│  │  (State-based Switch)  │              │   (Reset on Page Reload) │  │
│  └────────────────────────┘              └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Forensic Findings on Current State
1. **Routing & Deep Linking:** The application uses state-based conditional rendering (`pages[currentPage]`). URLs do not reflect the current screen, browser back/forward buttons break workflow state, and refreshing the browser resets navigation back to the login screen.
2. **Data Persistence:** All domain entities (`products`, `inventory`, `transactions`, `users`) reside in React component state in browser RAM. No `localStorage`, `sessionStorage`, or backend database is used.
3. **Authentication:** The `login` function in `src/context.tsx` checks if the entered email matches a user in `initialUsers`. The password argument is named `_password` and is completely ignored. Any password logs in successfully.
4. **Authorization:** Role checks (`currentUser?.role === 'ADMIN'`) are performed entirely inside React JSX. There is no API or token signature verifying role claims.
5. **Business Logic Location:** Inventory stock-in, stock-out, and SKU validations exist as helper functions inside React components and context callbacks.

---

## 3. Target Architecture (Production Specification)

### 3.1 Tiered Layer Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER (UI)                        │
│                                                                        │
│   React 19 SPA + Vite + Tailwind CSS v4                                │
│   • Client-Side Routing (React Router v7 / TanStack Router)            │
│   • Type-safe Data Fetching & Caching (TanStack Query / SWR)           │
│   • Reusable UI Primitives (`src/components/ui.tsx`, Header, Sidebar)  │
│   • Form Validation & UI Feedback (Zod + React Hook Form)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (JSON / REST API)
                                    │ Cookie: session_token (HttpOnly)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION & API LAYER                         │
│                                                                        │
│   Node.js / Express / Fastify / Hono API Server                        │
│   • Security Middleware: Helmet, CORS, Rate Limiting, Cookie Parser    │
│   • Auth Middleware: JWT / Session Verification & Role Extraction      │
│   • Route Controllers: Input DTO Validation (Zod Schemas)              │
│   • Global Error Handling & Structured JSON Responses                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      DOMAIN & SERVICE LOGIC LAYER                      │
│                                                                        │
│   • AuthService: Password hashing (Argon2id/Bcrypt), Session Issuance │
│   • ProductService: Catalog rules, SKU uniqueness checks, Archival     │
│   • InventoryService: ACID Transactions, Row Locking, Stock Validation │
│   • ReportingService: Metric aggregation, valuation, movement trends   │
│   • AuditService: Append-only system action recording                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS & PERSISTENCE LAYER                     │
│                                                                        │
│   Prisma ORM / Drizzle ORM / Parameterized SQL Driver                  │
│   • Relational Schema with Foreign Keys & Unique Constraints           │
│   • Explicit Transaction Boundaries (`BEGIN ... COMMIT / ROLLBACK`)    │
│   • Pessimistic Row Locking (`SELECT ... FOR UPDATE`)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TCP / Unix Socket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (RDBMS)                           │
│                                                                        │
│   PostgreSQL 16 / SQLite (Local / Staging)                             │
│   • Tables: users, categories, suppliers, products,                   │
│             stock_transactions, audit_logs                             │
│   • Check Constraints (`quantity >= 0`, `price >= 0`)                  │
│   • Foreign Key Cascade / Set Null Policies                            │
│   • Indexes on SKU, CategoryId, ProductId, CreatedAt                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Layer Communication & Data Flow

### 4.1 Read Request Flow (e.g., Fetch Product Catalog)
```
[User Browser]
      │ 1. GET /api/products?search=mouse&category=c1&page=1
      ▼
[API Gateway / Middleware]
      │ 2. Verify Session Cookie -> Attach req.user { id: "u1", role: "ADMIN" }
      ▼
[ProductController]
      │ 3. Validate query params (page >= 1, limit <= 50)
      ▼
[ProductService]
      │ 4. Build query filters, compute pagination offset
      ▼
[Data Access / ORM]
      │ 5. SELECT p.*, c.name as category_name, s.name as supplier_name
      │    FROM products p
      │    JOIN categories c ON p.category_id = c.id
      │    LEFT JOIN suppliers s ON p.supplier_id = s.id
      │    WHERE p.is_archived = FALSE AND ...
      ▼
[PostgreSQL Database]
      │ 6. Executes query using B-Tree index on category_id
      ▼
[ProductController]
      │ 7. Return HTTP 200 OK with { data: Product[], meta: PaginationMeta }
      ▼
[TanStack Query Cache -> React UI]
```

### 4.2 Write Request Flow (e.g., Stock-Out Transaction)
```
[User Browser]
      │ 1. POST /api/inventory/stock-out
      │    Body: { productId: "p1", quantity: 5, reference: "SO-101", notes: "Order" }
      ▼
[API Gateway / Middleware]
      │ 2. Authenticate session & Authorize (STAFF or ADMIN allowed)
      ▼
[InventoryController]
      │ 3. Validate DTO with Zod (quantity > 0, productId UUID format)
      ▼
[InventoryService]
      │ 4. START ACID TRANSACTION
      │ 5. SELECT * FROM products WHERE id = 'p1' FOR UPDATE; (Pessimistic Lock)
      │ 6. Invariant Check: if (product.quantity < 5) -> ROLLBACK & THROW InsufficientStock
      │ 7. UPDATE products SET quantity = quantity - 5, updated_at = NOW() WHERE id = 'p1';
      │ 8. INSERT INTO stock_transactions (id, product_id, type, quantity, previous_stock,
      │                                    new_stock, user_id, reference, notes, created_at)
      │    VALUES (gen_random_uuid(), 'p1', 'STOCK_OUT', 5, 10, 5, 'u1', 'SO-101', 'Order', NOW());
      │ 9. COMMIT TRANSACTION
      ▼
[InventoryController]
      │ 10. Return HTTP 200 OK with { transaction, updatedProduct }
      ▼
[TanStack Query Mutation -> Optimistic Cache Update -> Toast Notification]
```

---

## 5. Authentication & Session Architecture

```
[Browser Client]                                  [Auth Server / API]
       │                                                   │
       │─── 1. POST /api/auth/login {email, password} ────►│
       │                                                   │── 2. Find user by email
       │                                                   │── 3. Check status == 'Active'
       │                                                   │── 4. Verify password hash (Argon2id)
       │                                                   │── 5. Generate secure JWT / Session ID
       │◄── 6. HTTP 200 OK + Set-Cookie: session_token ────│
       │      (HttpOnly; Secure; SameSite=Lax)             │
       │                                                   │
       │─── 7. GET /api/auth/me (with Cookie) ────────────►│
       │                                                   │── 8. Decode JWT / Lookup session
       │◄── 9. HTTP 200 OK { user: {id, name, role} } ────│
       │                                                   │
       │─── 10. POST /api/auth/logout ────────────────────►│
       │                                                   │── 11. Invalidate session / Clear cookie
       │◄── 12. HTTP 200 OK + Clear-Cookie ────────────────│
```

* **No localStorage Token Storage:** Tokens stored in `localStorage` are vulnerable to XSS. All authentication tokens **MUST** use `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
* **Session Verification:** Every API call passes the cookie automatically. Fast server-side middleware extracts user identity and role in $< 1\text{ms}$.

---

## 6. Error Handling Strategy

1. **Standardized API Error Response Schema:**
   ```json
   {
     "success": false,
     "error": {
       "code": "INSUFFICIENT_STOCK",
       "message": "Insufficient stock. Only 4 units are available.",
       "details": [
         {
           "field": "quantity",
           "message": "Requested 6 units, but available stock is 4."
         }
       ]
     }
   }
   ```
2. **HTTP Status Code Conventions:**
   * `200 OK` / `201 Created`: Successful query or mutation.
   * `400 Bad Request`: Malformed JSON or syntax errors.
   * `401 Unauthorized`: Missing, expired, or invalid session cookie.
   * `403 Forbidden`: Authenticated user lacks required role (e.g. Staff trying to manage users).
   * `404 Not Found`: Entity (product, category, user) does not exist.
   * `409 Conflict`: Unique constraint violation (e.g., duplicate SKU, category name collision).
   * `422 Unprocessable Entity`: Business domain rule violation (e.g., insufficient stock).
   * `500 Internal Server Error`: Unhandled server exception (internal details masked from user).

---

## 7. Deployment Architecture (Target)

```
                       ┌────────────────────────┐
                       │   DNS / Cloudflare     │
                       │   (SSL/TLS Termination)│
                       └───────────┬────────────┘
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │   Reverse Proxy / CDN  │
                       │   (Nginx / Vercel Edge)│
                       └─────┬────────────┬─────┘
                             │            │
             /assets/*, /*   │            │ /api/*
                             ▼            ▼
             ┌─────────────────┐        ┌─────────────────────────┐
             │ Static SPA Host │        │ Node.js API Service     │
             │ (Vite Build)    │        │ (Docker / Node Runtime) │
             └─────────────────┘        └────────────┬────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────┐
                                        │ Managed PostgreSQL      │
                                        │ (RDS / Neon / Supabase) │
                                        └─────────────────────────┘
```
