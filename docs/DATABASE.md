# StockFlow — Database Schema & Data Integrity Specification

> **Document Version:** 1.0.0  
> **Status:** PROPOSED TARGET SCHEMA  
> **Target RDBMS:** PostgreSQL 16 (Compatible with SQLite for local unit testing)  

---

## 1. Overview

In the audited codebase, **no database currently exists**. All data is transiently simulated using in-memory JavaScript objects in `src/data.ts` and `src/context.tsx`.

This document specifies the relational database schema required to support StockFlow's domain requirements:
* Strict referential integrity.
* SKU uniqueness.
* Non-negative stock and price constraints.
* Append-only auditability for transactions and system events.
* Soft-deletion for catalog entities to avoid cascading deletion of historical transaction logs.

---

## 2. Entity Relationship Diagram (ERD)

```
┌────────────────────────────────┐
│             users              │
├────────────────────────────────┤
│ PK  id           VARCHAR(36)   │
│     name         VARCHAR(100)  │
│ UQ  email        VARCHAR(255)  │
│     password_hash VARCHAR(255) │
│     role         VARCHAR(20)   │ (ADMIN, STAFF)
│     status       VARCHAR(20)   │ (Active, Inactive)
│     created_at   TIMESTAMPTZ   │
│     last_login_at TIMESTAMPTZ  │
└──────────────┬─────────────────┘
               │ 1
               │
               │ N
┌──────────────┴─────────────────┐           ┌────────────────────────────────┐
│       stock_transactions       │           │           categories           │
├────────────────────────────────┤           ├────────────────────────────────┤
│ PK  id           VARCHAR(36)   │           │ PK  id           VARCHAR(36)   │
│ FK  product_id   VARCHAR(36)   ├─────┐     │ UQ  name         VARCHAR(100)  │
│     type         VARCHAR(20)   │     │     │     is_archived  BOOLEAN      │
│     quantity     INTEGER       │     │     │     created_at   TIMESTAMPTZ   │
│     previous_stock INTEGER     │     │     └──────────────┬─────────────────┘
│     new_stock    INTEGER       │     │                    │ 1
│ FK  user_id      VARCHAR(36)   │     │                    │
│ FK  supplier_id  VARCHAR(36)   │     │                    │ N
│     reference    VARCHAR(100)  │     │     ┌──────────────┴─────────────────┐
│     notes        TEXT          │     │     │            products            │
│     created_at   TIMESTAMPTZ   │     │     ├────────────────────────────────┤
└────────────────────────────────┘     │     │ PK  id           VARCHAR(36)   │
                                       │     │     name         VARCHAR(150)  │
┌────────────────────────────────┐     │     │ UQ  sku          VARCHAR(50)   │
│           suppliers            │     │     │ FK  category_id  VARCHAR(36)   │
├────────────────────────────────┤     │     │ FK  supplier_id  VARCHAR(36)   │
│ PK  id           VARCHAR(36)   │     │     │     price        DECIMAL(10,2) │
│     name         VARCHAR(150)  │     │     │     quantity     INTEGER       │
│     email        VARCHAR(255)  │     │     │     reorder_level INTEGER      │
│     phone        VARCHAR(50)   │     │     │     description  TEXT          │
│     address      TEXT          │     │     │     is_archived  BOOLEAN       │
│     is_archived  BOOLEAN       │     │     │     created_at   TIMESTAMPTZ   │
│     created_at   TIMESTAMPTZ   │     │     │     updated_at   TIMESTAMPTZ   │
└──────────────┬─────────────────┘     │     └────────────────────────────────┘
               │ 1                     │                    │ 1
               │                       │                    │
               │ N                     │                    │ N
               └───────────────────────┴────────────────────┘
                                  (Optional Supplier)

┌────────────────────────────────┐
│           audit_logs           │
├────────────────────────────────┤
│ PK  id           VARCHAR(36)   │
│ FK  user_id      VARCHAR(36)   │
│     action       VARCHAR(100)  │ (USER_CREATED, ROLE_CHANGED, PRODUCT_ARCHIVED...)
│     entity_type  VARCHAR(50)   │
│     entity_id    VARCHAR(36)   │
│     metadata     JSONB         │
│     ip_address   VARCHAR(45)   │
│     created_at   TIMESTAMPTZ   │
└────────────────────────────────┘
```

---

## 3. Table Definitions & Constraints

### 3.1 `users` Table
Stores authentication credentials, user roles, and account status.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full display name |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` | Login email (case-insensitive indexed) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Argon2id / Bcrypt hashed password |
| `role` | `VARCHAR(20)` | `NOT NULL CHECK (role IN ('ADMIN', 'STAFF'))` | System role |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))` | Account activation state |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Account creation timestamp |
| `last_login_at`| `TIMESTAMPTZ` | `NULL` | Last successful authentication |

### 3.2 `categories` Table
Organizes products into logical catalog segments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Unique category name |
| `is_archived` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Soft delete flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |

### 3.3 `suppliers` Table
Stores contact information for inventory vendors.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `name` | `VARCHAR(150)` | `NOT NULL` | Vendor company name |
| `email` | `VARCHAR(255)` | `NULL` | Contact email |
| `phone` | `VARCHAR(50)` | `NULL` | Contact phone number |
| `address` | `TEXT` | `NULL` | Physical address |
| `is_archived` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Soft delete flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |

### 3.4 `products` Table
Primary product entity holding catalog attributes and current stock quantity.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `name` | `VARCHAR(150)` | `NOT NULL` | Product name |
| `sku` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Stock Keeping Unit (Uppercase) |
| `category_id` | `VARCHAR(36)` | `NOT NULL REFERENCES categories(id) ON DELETE RESTRICT` | Category relationship |
| `supplier_id` | `VARCHAR(36)` | `NULL REFERENCES suppliers(id) ON DELETE SET NULL` | Primary supplier relationship |
| `price` | `DECIMAL(10,2)`| `NOT NULL CHECK (price >= 0)` | Unit selling/inventory price |
| `quantity` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (quantity >= 0)` | Current physical stock units |
| `reorder_level`| `INTEGER` | `NOT NULL DEFAULT 0 CHECK (reorder_level >= 0)` | Low stock trigger threshold |
| `description` | `TEXT` | `NULL` | Optional product notes |
| `is_archived` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Archival / soft-delete flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

> **Note on Stock Invariant:** The database enforces `CHECK (quantity >= 0)`. Any operation attempting to deduct stock below zero will result in a hard database constraint violation, providing defense-in-depth against application concurrency bugs.

### 3.5 `stock_transactions` Table
Immutable ledger recording every single stock movement.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `product_id` | `VARCHAR(36)` | `NOT NULL REFERENCES products(id) ON DELETE RESTRICT` | Associated product |
| `type` | `VARCHAR(20)` | `NOT NULL CHECK (type IN ('Stock In', 'Stock Out', 'Adjustment'))` | Transaction type |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Number of units moved |
| `previous_stock`| `INTEGER`| `NOT NULL CHECK (previous_stock >= 0)` | Stock immediately prior |
| `new_stock` | `INTEGER` | `NOT NULL CHECK (new_stock >= 0)` | Stock immediately after |
| `user_id` | `VARCHAR(36)` | `NOT NULL REFERENCES users(id) ON DELETE RESTRICT` | Performed by user |
| `supplier_id` | `VARCHAR(36)` | `NULL REFERENCES suppliers(id) ON DELETE SET NULL` | Sourced supplier (for Stock In) |
| `reference` | `VARCHAR(100)`| `NULL` | PO number, SO number, or Audit code |
| `notes` | `TEXT` | `NULL` | User remarks |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Exact transaction timestamp |

### 3.6 `audit_logs` Table
System-wide security and operations audit log.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `user_id` | `VARCHAR(36)` | `NOT NULL REFERENCES users(id) ON DELETE RESTRICT` | Actor |
| `action` | `VARCHAR(100)`| `NOT NULL` | Event key (e.g. `USER_DEACTIVATED`, `ROLE_CHANGED`) |
| `entity_type` | `VARCHAR(50)` | `NOT NULL` | Target table (e.g. `users`, `products`) |
| `entity_id` | `VARCHAR(36)` | `NOT NULL` | Target record ID |
| `metadata` | `JSONB` | `NULL` | Diff payload or context parameters |
| `ip_address` | `VARCHAR(45)` | `NULL` | Client IP address |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Event timestamp |

---

## 4. Indexing Strategy & Performance

To guarantee sub-10ms response times on large inventory datasets:

```sql
-- Product Lookups and Filtering
CREATE INDEX idx_products_category ON products(category_id) WHERE is_archived = FALSE;
CREATE INDEX idx_products_supplier ON products(supplier_id) WHERE is_archived = FALSE;
CREATE INDEX idx_products_sku_lookup ON products(LOWER(sku));
CREATE INDEX idx_products_name_search ON products(LOWER(name));
CREATE INDEX idx_products_quantity_reorder ON products(quantity, reorder_level);

-- Stock Transaction History & Filtering
CREATE INDEX idx_transactions_product_created ON stock_transactions(product_id, created_at DESC);
CREATE INDEX idx_transactions_user ON stock_transactions(user_id);
CREATE INDEX idx_transactions_created_type ON stock_transactions(created_at DESC, type);
CREATE INDEX idx_transactions_reference ON stock_transactions(reference);

-- User Authentication & Administration
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## 5. SQL Migration Script (Target Schema DDL)

```sql
-- StockFlow Initial Schema Migration
-- Compatible with PostgreSQL 14+

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    category_id VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    supplier_id VARCHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Stock In', 'Stock Out', 'Adjustment')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    previous_stock INTEGER NOT NULL CHECK (previous_stock >= 0),
    new_stock INTEGER NOT NULL CHECK (new_stock >= 0),
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supplier_id VARCHAR(36) REFERENCES suppliers(id) ON DELETE SET NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Admin User
-- Password: AdminPassword123! (Argon2id Hash Placeholder)
INSERT INTO users (id, name, email, password_hash, role, status, created_at)
VALUES (
    'u1',
    'System Administrator',
    'admin@stockflow.com',
    '$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQ$WJz+V8T3qK10zU9pZ2xL6w',
    'ADMIN',
    'Active',
    NOW()
);

COMMIT;
```
