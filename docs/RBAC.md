# StockFlow — Role-Based Access Control (RBAC) Specification

> **Document Version:** 2.0.0  
> **Status:** ✅ FULLY IMPLEMENTED & ENFORCED IN PRODUCTION  
> **Classification:** Security & Access Control  

---

## 1. Executive Summary

StockFlow implements a strict two-role security model designed to separate **System Administration** from **Warehouse Operations**:

1. **`ADMIN` (Administrator):** Unrestricted access to catalog management, vendor management, user provisioning, role assignments, account lifecycle, operational workflows, and security audit logs.
2. **`STAFF` (Warehouse / Operations Staff):** Operational access to browse catalog records, monitor inventory levels, execute stock-in replenishment, execute stock-out fulfillment, review transaction history, and view operational analytics.

---

## 2. Comprehensive Permissions Matrix

| Functional Capability | ADMIN | STAFF | UI Status | Server Enforcement |
| :--- | :---: | :---: | :--- | :--- |
| **Authentication & Profile** |
| Login to System | ✅ | ✅ | Implemented & Active | Verify Bcrypt hash & `status == 'Active'` |
| Logout & Terminate Session | ✅ | ✅ | Implemented & Active | Clear HTTP-only session cookie + delete DB session |
| Change Own Password | ✅ | ✅ | Implemented & Active | `POST /api/auth/change-password` |
| **Dashboard & Analytics** |
| View System KPI Cards | ✅ | ✅ | Implemented & Active | `GET /api/reports/summary` |
| View Stock Health Distribution | ✅ | ✅ | Implemented & Active | `GET /api/reports/summary` |
| View Recent Transactions Feed | ✅ | ✅ | Implemented & Active | `GET /api/transactions?limit=6` |
| View Low Stock Alert Table | ✅ | ✅ | Implemented & Active | `GET /api/products?status=LOW_STOCK` |
| **Catalog & Products** |
| View & Search Product Catalog | ✅ | ✅ | Implemented & Active | `GET /api/products` |
| View Product Details & Stock History | ✅ | ✅ | Implemented & Active | `GET /api/products/:id` |
| Create New Product | ✅ | ❌ | Admin Only (Hidden in Staff UI) | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| Edit Existing Product | ✅ | ❌ | Admin Only (Hidden in Staff UI) | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| Archive / Delete Product | ✅ | ❌ | Admin Only (Hidden in Staff UI) | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| **Categories & Suppliers** |
| View Categories List | ✅ | ✅ | Implemented & Active | `GET /api/categories` |
| Create / Edit / Delete Category | ✅ | ❌ | Admin Only (Buttons hidden) | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| View Suppliers Directory | ✅ | ✅ | Implemented & Active | `GET /api/suppliers` |
| Create / Edit / Delete Supplier | ✅ | ❌ | Admin Only (Buttons hidden) | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| **Inventory & Transactions** |
| View Central Inventory Stock Table | ✅ | ✅ | Implemented & Active | `GET /api/inventory` |
| Execute Stock In (Replenishment) | ✅ | ✅ | Implemented & Active | `POST /api/inventory/stock-in` |
| Execute Stock Out (Fulfillment) | ✅ | ✅ | Implemented & Active | `POST /api/inventory/stock-out` |
| Execute Inventory Adjustment | ✅ | ❌ | Admin Only | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| View Transaction Ledger History | ✅ | ✅ | Implemented & Active | `GET /api/transactions` |
| View Single Transaction Details | ✅ | ✅ | Implemented & Active | `GET /api/transactions/:id` |
| Modify / Delete Historical Transaction | ❌ | ❌ | Blocked (Immutable) | Zero endpoints exposed (Append-only ledger) |
| **Operational Reports** |
| View Inventory Summary Report | ✅ | ✅ | Implemented & Active | `GET /api/reports/summary` |
| View Stock Movement Breakdown | ✅ | ✅ | Implemented & Active | `GET /api/reports/movement` |
| View Low Stock Report | ✅ | ✅ | Implemented & Active | `GET /api/reports/low-stock` |
| View Inventory Valuation Report | ✅ | ✅ | Implemented & Active | `GET /api/reports/valuation` |
| **User Administration** |
| View Users List & Activity | ✅ | ❌ | Blocked (Shows Access Denied) | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| Provision New User Account | ✅ | ❌ | Admin Only Modal | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| Edit User Details & Reassign Role | ✅ | ❌ | Admin Only Modal | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| Deactivate / Reactivate User Account | ✅ | ❌ | Admin Only Action | Server Route Guard: `requireAdmin` (`403 Forbidden`) |
| Delete User Account | ✅ | ❌ | Admin Only Action | Server Route Guard: `requireAdmin` + Last-Admin Guard |
| View System Audit Logs | ✅ | ❌ | Admin Only | Server Route Guard: `requireAdmin` (`403 Forbidden`) |

---

## 3. Client-Side vs. Server-Side Security Separation

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT-SIDE ACCESS CONTROL (UX ONLY)                 │
│                                                                        │
│  • Conditional UI Rendering:                                           │
│    - Hides "Add Product", "Edit", "Archive" buttons for Staff.         │
│    - Hides "Users" tab in Sidebar navigation.                          │
│    - Renders `<AccessDenied />` screen if Staff navigates to `/users`. │
│                                                                        │
│  ⚠️ CRITICAL SECURITY WARNING:                                         │
│  Client-side checks provide ZERO security against deliberate tampering.│
│  Any user can open DevTools or issue direct HTTP requests.             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             SERVER-SIDE AUTHORIZATION (AUTHORITATIVE SECURITY)         │
│                                                                        │
│  • Cryptographic Token Verification:                                   │
│    Every request inspects the signed session token.                    │
│                                                                        │
│  • Route-Level RBAC Middleware:                                        │
│    function requireRole(allowedRoles: Role[]) {                        │
│      return (req, res, next) => {                                      │
│        if (!req.user || !allowedRoles.includes(req.user.role)) {      │
│          return res.status(403).json({                                 │
│            error: "Forbidden: Administrative privilege required."      │
│          });                                                           │
│        }                                                               │
│        next();                                                         │
│      };                                                                │
│    }                                                                   │
│                                                                        │
│  • Database Row-Level / State Validation:                              │
│    Verifies user status is 'Active' in database before executing.      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Privilege Escalation Prevention Rules

1. **Self-Role Modification Blocked:**
   * An Admin cannot accidentally revoke their own Admin privilege if they are the sole remaining active Admin in the organization.
2. **Staff Role Modification Prohibited:**
   * Staff endpoints (`POST /api/auth/change-password`, `PATCH /api/users/me`) accept only profile fields (`name`, `currentPassword`, `newPassword`). Fields like `role`, `status`, and `email` are strictly ignored on self-service endpoints.
3. **Session Invalidation on Deactivation:**
   * When an Admin deactivates a user (`status = 'Inactive'`), any active JWT or session ID belonging to that user must be invalidated immediately in the server session cache/database.
4. **Audit Logging for Security Events:**
   * Every role assignment change (`STAFF` $\rightarrow$ `ADMIN` or `ADMIN` $\rightarrow$ `STAFF`) and every account status toggle (`Active` $\leftrightarrow$ `Inactive`) produces an immutable row in `audit_logs`.
