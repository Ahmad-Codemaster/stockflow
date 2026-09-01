# StockFlow — Requirements Traceability Matrix (RTM)

> **Document Version:** 1.0.0  
> **Status:** AUDITED & MAPPED  
> **Purpose:** Trace every product requirement from business intent $\rightarrow$ UI screen $\rightarrow$ Code $\rightarrow$ Backend/API $\rightarrow$ Database $\rightarrow$ Automated Test.  

---

## 1. Traceability Matrix

| Req ID | Requirement Description | Current Implementation | Target Implementation | Relevant Screen | Relevant Code | Relevant Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-AUTH-001** | User authentication with email and password | Client-only email lookup in `initialUsers`; password ignored | Server Argon2id hash verification + HTTP-only JWT cookie | `Login.tsx` | `src/context.tsx:74` | `auth-login.test.ts` | **MOCKED** |
| **REQ-AUTH-002** | Inactive users cannot authenticate | Client check `user.status === 'Inactive'` returns `'inactive'` | Server rejects login with HTTP 403; revokes active sessions | `Login.tsx` | `src/context.tsx:77` | `auth-inactive-block.test.ts` | **PARTIAL** |
| **REQ-AUTH-003** | User session logout | Clears `currentUser` in React state | Clears HTTP-only session cookie & invalidates server session | `Header.tsx`, `Sidebar.tsx` | `src/context.tsx:82` | `auth-logout.test.ts` | **PARTIAL** |
| **REQ-RBAC-001** | Admin has full access to all system features | Visual check `currentUser?.role === 'ADMIN'` | Server-side role guard `requireRole('ADMIN')` on all modifying routes | All Screens | `src/components/Sidebar.tsx:75` | `rbac-admin-access.test.ts` | **PARTIAL** |
| **REQ-RBAC-002** | Staff cannot access user management or role changes | Renders `<AccessDenied />` if Staff navigates to `/users` | Server returns HTTP 403 Forbidden on `/api/v1/users/*` | `Users.tsx` | `src/pages/Users.tsx:79` | `rbac-staff-denied.test.ts` | **PARTIAL** |
| **REQ-PROD-001** | View product catalog with search, filter, and pagination | Client-side `.filter()` and `.slice()` on mock array | Server-side query with SQL `WHERE`, `ILIKE`, and `LIMIT/OFFSET` | `Products.tsx` | `src/pages/Products.tsx:27` | `product-list-filter.test.ts` | **PARTIAL** |
| **REQ-PROD-002** | Create product with required attributes (Name, SKU, Price, etc.) | In-memory `addProduct()` callback in context | `POST /api/v1/products` into PostgreSQL with unique SKU index | `ProductForm.tsx` | `src/context.tsx:107` | `product-create.test.ts` | **PARTIAL** |
| **REQ-PROD-003** | Product SKU must be unique | In-memory `skuExists()` array check | Database `UNIQUE INDEX` + API 409 Conflict response | `ProductForm.tsx` | `src/context.tsx:103` | `product-duplicate-sku.test.ts` | **PARTIAL** |
| **REQ-PROD-004** | Product SKU is immutable after creation | Disabled input field in edit mode | Read-only in UI; backend ignores or rejects SKU change in `PUT` | `ProductForm.tsx` | `src/pages/ProductForm.tsx:100` | `product-sku-immutable.test.ts` | **PARTIAL** |
| **REQ-PROD-005** | Archive product while preserving transaction history | Deletes product from array (`.filter()`) — **Flawed** | Soft-delete `is_archived = TRUE` in database | `Products.tsx`, `ProductDetail.tsx` | `src/context.tsx:140` | `product-archive-integrity.test.ts` | **BROKEN** |
| **REQ-CAT-001** | Manage product categories (CRUD) | In-memory array mutation in context | `categories` table with unique name constraint & API | `Categories.tsx` | `src/pages/Categories.tsx:32` | `category-crud.test.ts` | **PARTIAL** |
| **REQ-SUPP-001** | Manage supplier directory (CRUD) | In-memory array mutation in context | `suppliers` table & REST API endpoints | `Suppliers.tsx` | `src/pages/Suppliers.tsx:47` | `supplier-crud.test.ts` | **PARTIAL** |
| **REQ-INV-001** | Central inventory monitoring with stock level indicators | Computed from `inventory` mock array | Real-time database query on `products.quantity` | `Inventory.tsx` | `src/pages/Inventory.tsx:17` | `inventory-levels.test.ts` | **PARTIAL** |
| **REQ-INV-002** | Stock-In increases stock and creates transaction record | In-memory state mutation | ACID SQL Transaction: `UPDATE products` + `INSERT stock_transactions` | `StockIn.tsx` | `src/context.tsx:187` | `stock-in-atomic.test.ts` | **PARTIAL** |
| **REQ-INV-003** | Stock-Out decreases stock and creates transaction record | In-memory state mutation | ACID SQL Transaction with `SELECT ... FOR UPDATE` row lock | `StockOut.tsx` | `src/context.tsx:213` | `stock-out-atomic.test.ts` | **PARTIAL** |
| **REQ-INV-004** | Stock cannot become negative under any circumstance | UI check `qty > currentStock` returns false | Server validation + DB `CHECK(quantity >= 0)` + Row lock | `StockOut.tsx` | `src/context.tsx:215` | `stock-out-negative-prevent.test.ts` | **PARTIAL** |
| **REQ-INV-005** | Stock status derivation (`In Stock`, `Low Stock`, `Out of Stock`) | In-memory helper `getStockStatus()` | Computed via SQL / domain model from `quantity` and `reorder_level` | `ui.tsx`, All Pages | `src/context.tsx:94` | `stock-status-derivation.test.ts` | **DONE (UI)** |
| **REQ-TXN-001** | Immutable transaction ledger | Read-only UI table; no delete/edit buttons | Append-only `stock_transactions` table with no delete endpoints | `Transactions.tsx`, `TransactionDetail.tsx` | `src/pages/Transactions.tsx:17` | `transaction-immutable.test.ts` | **DONE (UI)** |
| **REQ-REP-001** | Operational reporting & inventory valuation | Computed via client-side `.reduce()` on arrays | Database aggregation queries (`SUM(quantity * price)`, etc.) | `Reports.tsx` | `src/pages/Reports.tsx:41` | `reports-aggregation.test.ts` | **PARTIAL** |
| **REQ-USER-001** | Admin can provision new user accounts | In-memory array push in context | `POST /api/v1/users` with temporary password & role | `Users.tsx` | `src/pages/Users.tsx:41` | `user-provision.test.ts` | **PARTIAL** |
| **REQ-USER-002** | Admin can change user roles (`ADMIN` $\leftrightarrow$ `STAFF`) | In-memory array update with warning dialog | `PATCH /api/v1/users/:id/role` + audit logging | `Users.tsx` | `src/pages/Users.tsx:67` | `user-role-change.test.ts` | **PARTIAL** |
| **REQ-USER-003** | Admin can deactivate/activate user accounts | In-memory status update with confirm dialog | `PATCH /api/v1/users/:id/status` + session invalidation | `Users.tsx` | `src/pages/Users.tsx:74` | `user-deactivate.test.ts` | **PARTIAL** |
| **REQ-AUD-001** | System audit logging for security events | **Missing** | `audit_logs` table recording all admin actions | N/A | *Not Implemented* | `audit-logging.test.ts` | **MISSING** |
