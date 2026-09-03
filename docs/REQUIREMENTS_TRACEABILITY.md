# StockFlow — Requirements Traceability Matrix (RTM)

> **Document Version:** 2.0.0  
> **Status:** ✅ VERIFIED & FULLY IMPLEMENTED (100% PASS)  
> **Purpose:** Trace every product requirement from business intent $\rightarrow$ UI screen $\rightarrow$ Code $\rightarrow$ Backend/API $\rightarrow$ Database $\rightarrow$ Automated Test.  

---

## 1. Traceability Matrix

| Req ID | Requirement Description | Production Implementation | Architecture Layer & Code | Relevant Screen | Passing Test Suite | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-AUTH-001** | User authentication with email and password | Bcrypt password verification + crypto session table in SQLite | `server/controllers/authController.ts`<br>`server/services/authService.ts` | `Login.tsx` | `tests/auth.test.ts` | **VERIFIED (100%)** |
| **REQ-AUTH-002** | Inactive users cannot authenticate | Server rejects login with HTTP 403; instant session termination | `server/services/authService.ts`<br>`server/controllers/userController.ts` | `Login.tsx` | `tests/auth.test.ts`<br>`tests/users-audit.test.ts` | **VERIFIED (100%)** |
| **REQ-AUTH-003** | User session logout | Deletes session record from DB & clears HttpOnly cookie | `server/controllers/authController.ts` | `Header.tsx`<br>`Sidebar.tsx` | `tests/auth.test.ts` | **VERIFIED (100%)** |
| **REQ-RBAC-001** | Admin has full access to all system features | Express RBAC middleware `requireRole('ADMIN')` on sensitive routes | `server/middleware/rbac.ts` | All Screens | `tests/rbac.test.ts`<br>`src/components/__tests__/Sidebar.test.tsx` | **VERIFIED (100%)** |
| **REQ-RBAC-002** | Staff cannot access user management or role changes | Server returns HTTP 403; sidebar hides Admin section | `server/middleware/rbac.ts` | `Users.tsx`<br>`Sidebar.tsx` | `tests/rbac.test.ts`<br>`src/components/__tests__/Sidebar.test.tsx` | **VERIFIED (100%)** |
| **REQ-PROD-001** | View product catalog with search, filter, and pagination | SQL query with category filter, search parameter, and pagination | `server/controllers/productController.ts`<br>`server/services/productService.ts` | `Products.tsx` | `tests/products.test.ts`<br>`tests/user-service.test.ts` | **VERIFIED (100%)** |
| **REQ-PROD-002** | Create product with required attributes (Name, SKU, Price, etc.) | Atomic transaction creating product + initial stock transaction | `server/services/productService.ts` | `ProductForm.tsx` | `tests/products.test.ts` | **VERIFIED (100%)** |
| **REQ-PROD-003** | Product SKU must be unique | SQLite unique constraint + uppercase normalization | `prisma/schema.prisma`<br>`server/services/productService.ts` | `ProductForm.tsx` | `tests/products.test.ts` | **VERIFIED (100%)** |
| **REQ-PROD-004** | Product SKU is immutable after creation | Backend rejects SKU mutation during update; disabled in UI | `server/services/productService.ts` | `ProductForm.tsx` | `tests/products.test.ts` | **VERIFIED (100%)** |
| **REQ-PROD-005** | Archive product while preserving transaction history | Soft deletion `isArchived: true` preserving historical ledgers | `server/services/productService.ts` | `Products.tsx`<br>`ProductDetail.tsx` | `tests/products.test.ts` | **VERIFIED (100%)** |
| **REQ-CAT-001** | Manage product categories (CRUD) | Category repository with uniqueness check & in-use deletion guard | `server/controllers/categoryController.ts`<br>`server/services/categoryService.ts` | `Categories.tsx` | `tests/categories-suppliers.test.ts` | **VERIFIED (100%)** |
| **REQ-SUPP-001** | Manage supplier directory (CRUD) | Supplier repository with lead-time tracking and relational safety | `server/controllers/supplierController.ts`<br>`server/services/supplierService.ts` | `Suppliers.tsx` | `tests/categories-suppliers.test.ts` | **VERIFIED (100%)** |
| **REQ-INV-001** | Central inventory monitoring with stock level indicators | SQL aggregation of `products.quantity` and status derivation | `server/controllers/inventoryController.ts` | `Inventory.tsx` | `tests/inventory.test.ts` | **VERIFIED (100%)** |
| **REQ-INV-002** | Stock-In increases stock and creates transaction record | Atomic `prisma.$transaction` updating quantity & creating ledger row | `server/services/inventoryService.ts` | `StockIn.tsx` | `tests/inventory.test.ts` | **VERIFIED (100%)** |
| **REQ-INV-003** | Stock-Out decreases stock and creates transaction record | Atomic serialized transaction updating quantity & creating ledger row | `server/services/inventoryService.ts` | `StockOut.tsx` | `tests/inventory.test.ts`<br>`tests/concurrency.test.ts` | **VERIFIED (100%)** |
| **REQ-INV-004** | Stock cannot become negative under any circumstance | Server-enforced invariant `stock - qty >= 0` with AsyncLock mutex | `server/services/inventoryService.ts` | `StockOut.tsx` | `tests/inventory.test.ts`<br>`tests/concurrency.test.ts` | **VERIFIED (100%)** |
| **REQ-INV-005** | Stock status derivation (`In Stock`, `Low Stock`, `Out of Stock`) | Pure domain functions mapping quantity and reorderLevel | `src/utils/formatters.ts`<br>`server/services/inventoryService.ts` | All Pages | `tests/inventory.test.ts`<br>`src/utils/__tests__/formatters.test.ts` | **VERIFIED (100%)** |
| **REQ-TXN-001** | Immutable transaction ledger | Append-only database table with no UPDATE or DELETE routes | `prisma/schema.prisma`<br>`server/services/inventoryService.ts` | `Transactions.tsx`<br>`TransactionDetail.tsx` | `tests/inventory.test.ts`<br>`tests/more-auth.test.ts` | **VERIFIED (100%)** |
| **REQ-REP-001** | Operational reporting & inventory valuation | SQL aggregation (`SUM`, `COUNT`) for valuation and velocity | `server/services/reportService.ts` | `Reports.tsx` | `tests/reports.test.ts` | **VERIFIED (100%)** |
| **REQ-USER-001** | Admin can provision new user accounts | Bcrypt user provisioning with email normalization | `server/services/userService.ts` | `Users.tsx` | `tests/users-audit.test.ts` | **VERIFIED (100%)** |
| **REQ-USER-002** | Admin can change user roles (`ADMIN` $\leftrightarrow$ `STAFF`) | Role update route with self-demotion guards and session sync | `server/services/userService.ts` | `Users.tsx` | `tests/users-audit.test.ts`<br>`tests/rbac.test.ts` | **VERIFIED (100%)** |
| **REQ-USER-003** | Admin can deactivate/activate user accounts | User status route with immediate active session invalidation | `server/services/userService.ts` | `Users.tsx` | `tests/users-audit.test.ts` | **VERIFIED (100%)** |
| **REQ-AUD-001** | System audit logging for security events | Append-only `audit_logs` table tracking admin & security events | `server/services/auditService.ts` | `Users.tsx` | `tests/users-audit.test.ts` | **VERIFIED (100%)** |

