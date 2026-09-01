# StockFlow — RESTful API Specification

> **Document Version:** 1.0.0  
> **Status:** PLANNED TARGET SPECIFICATION (Audited Current Repository has 0 Backend Endpoints)  
> **Base URL:** `/api/v1`  
> **Protocol:** HTTPS with JSON Request/Response Payloads  

---

## 1. Global API Standards

### 1.1 Authentication & Authorization
* **Session Transport:** `HttpOnly`, `Secure`, `SameSite=Lax` cookie named `stockflow_session` or `Authorization: Bearer <jwt_token>` header.
* **Role Verification:** Server-side middleware verifies claims (`ADMIN` vs. `STAFF`).
* **Unauthenticated Requests:** Returns `401 Unauthorized`.
* **Unauthorized Role Requests:** Returns `403 Forbidden`.

### 1.2 Standard Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalRecords": 45,
    "totalPages": 5
  }
}
```

### 1.3 Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed.",
    "details": [
      { "field": "sku", "message": "SKU already exists." }
    ]
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 `POST /api/v1/auth/login`
Authenticates user credentials and issues a secure session.

* **Auth Required:** No (Public)
* **Allowed Roles:** All
* **Request Body:**
  ```json
  {
    "email": "ahmad@stockflow.com",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "u1",
        "name": "Ahmad Khan",
        "email": "ahmad@stockflow.com",
        "role": "ADMIN",
        "status": "Active"
      }
    }
  }
  ```
* **Error Responses:**
  * `400 Bad Request`: Missing email or password format.
  * `401 Unauthorized`: `"Invalid email or password."`
  * `403 Forbidden`: `"This account has been deactivated. Contact your administrator."`

### 2.2 `POST /api/v1/auth/logout`
Terminates the active session and clears cookies.

* **Auth Required:** Yes
* **Allowed Roles:** All
* **Success Response (`200 OK`):**
  ```json
  { "success": true, "data": { "message": "Logged out successfully." } }
  ```

### 2.3 `GET /api/v1/auth/me`
Fetches the profile of the currently authenticated user.

* **Auth Required:** Yes
* **Allowed Roles:** All
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "u1",
      "name": "Ahmad Khan",
      "email": "ahmad@stockflow.com",
      "role": "ADMIN",
      "status": "Active"
    }
  }
  ```

---

## 3. Product Catalog Endpoints

### 3.1 `GET /api/v1/products`
Lists products with pagination, search, category filter, and stock status filter.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`
* **Query Parameters:**
  * `search`: string (matches `name` or `sku`)
  * `categoryId`: string
  * `status`: `IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`
  * `sortBy`: `name` | `stock` | `createdAt`
  * `sortDir`: `asc` | `desc`
  * `page`: integer (default `1`)
  * `pageSize`: integer (default `10`, max `100`)
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "p1",
        "name": "Wireless Mouse",
        "sku": "WM-001",
        "categoryId": "c1",
        "categoryName": "Computer Accessories",
        "supplierId": "s1",
        "supplierName": "TechSource Ltd",
        "price": 25.99,
        "currentStock": 4,
        "reorderLevel": 10,
        "stockStatus": "Low Stock",
        "description": "Ergonomic wireless mouse",
        "createdAt": "2024-01-20T00:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "pageSize": 10, "totalRecords": 8, "totalPages": 1 }
  }
  ```

### 3.2 `POST /api/v1/products`
Creates a new product and optionally records an initial stock transaction.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`
* **Request Body:**
  ```json
  {
    "name": "Mechanical Keyboard Pro",
    "sku": "MK-009",
    "categoryId": "c1",
    "supplierId": "s1",
    "price": 99.99,
    "initialStock": 15,
    "reorderLevel": 5,
    "description": "RGB hot-swappable keyboard."
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "p9",
      "name": "Mechanical Keyboard Pro",
      "sku": "MK-009",
      "currentStock": 15,
      "stockStatus": "In Stock"
    }
  }
  ```
* **Error Responses:**
  * `403 Forbidden`: User is `STAFF`.
  * `409 Conflict`: SKU already exists.
  * `422 Unprocessable Entity`: Negative price or invalid category ID.

### 3.3 `GET /api/v1/products/:id`
Retrieves single product details, real-time stock analytics, and recent transactions.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`
* **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "p1",
      "name": "Wireless Mouse",
      "sku": "WM-001",
      "categoryId": "c1",
      "categoryName": "Computer Accessories",
      "supplierId": "s1",
      "supplierName": "TechSource Ltd",
      "price": 25.99,
      "currentStock": 4,
      "reorderLevel": 10,
      "stockStatus": "Low Stock",
      "totalStockIn": 10,
      "totalStockOut": 6,
      "inventoryValue": 103.96,
      "description": "Ergonomic wireless mouse.",
      "createdAt": "2024-01-20T00:00:00.000Z"
    }
  }
  ```

### 3.4 `PUT /api/v1/products/:id`
Updates product catalog information (SKU is immutable).

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`
* **Request Body:**
  ```json
  {
    "name": "Wireless Mouse v2",
    "categoryId": "c1",
    "supplierId": "s1",
    "price": 27.99,
    "reorderLevel": 8,
    "description": "Updated version 2."
  }
  ```
* **Success Response (`200 OK`):** Updated product object.

### 3.5 `DELETE /api/v1/products/:id`
Soft-deletes/archives a product.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`
* **Success Response (`200 OK`):**
  ```json
  { "success": true, "data": { "message": "Product archived successfully." } }
  ```

---

## 4. Category & Supplier Endpoints

### 4.1 Categories
* `GET /api/v1/categories` — List all active categories + product count. (Roles: `ADMIN`, `STAFF`)
* `POST /api/v1/categories` — Create category `{ name: string }`. (Roles: `ADMIN`)
* `PUT /api/v1/categories/:id` — Update category name. (Roles: `ADMIN`)
* `DELETE /api/v1/categories/:id` — Soft-delete category. (Roles: `ADMIN`)

### 4.2 Suppliers
* `GET /api/v1/suppliers` — List all active suppliers + product count. (Roles: `ADMIN`, `STAFF`)
* `POST /api/v1/suppliers` — Create supplier `{ name, email, phone, address }`. (Roles: `ADMIN`)
* `PUT /api/v1/suppliers/:id` — Update supplier details. (Roles: `ADMIN`)
* `DELETE /api/v1/suppliers/:id` — Soft-delete supplier. (Roles: `ADMIN`)

---

## 5. Inventory & Transaction Endpoints

### 5.1 `POST /api/v1/inventory/stock-in`
Executes an atomic Stock-In inventory replenishment.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`
* **Request Body:**
  ```json
  {
    "productId": "p2",
    "quantity": 10,
    "supplierId": "s1",
    "reference": "PO-2026-005",
    "notes": "Restocking from TechSource"
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "transaction": {
        "id": "t10",
        "productId": "p2",
        "type": "Stock In",
        "quantity": 10,
        "previousStock": 23,
        "newStock": 33,
        "performedBy": "Ahmad Khan",
        "reference": "PO-2026-005",
        "createdAt": "2026-08-30T10:00:00.000Z"
      },
      "currentStock": 33,
      "stockStatus": "In Stock"
    }
  }
  ```

### 5.2 `POST /api/v1/inventory/stock-out`
Executes an atomic Stock-Out fulfillment with strict negative stock prevention.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`
* **Request Body:**
  ```json
  {
    "productId": "p1",
    "quantity": 3,
    "reference": "SO-2026-088",
    "notes": "Office fulfillment batch"
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "transaction": {
        "id": "t11",
        "productId": "p1",
        "type": "Stock Out",
        "quantity": 3,
        "previousStock": 4,
        "newStock": 1,
        "performedBy": "Ali Raza",
        "reference": "SO-2026-088",
        "createdAt": "2026-08-30T10:05:00.000Z"
      },
      "currentStock": 1,
      "stockStatus": "Low Stock"
    }
  }
  ```
* **Error Responses:**
  * `422 Unprocessable Entity`: `"Insufficient stock. Only 4 units are available."`

### 5.3 `GET /api/v1/transactions`
Retrieves immutable transaction history with filtering.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`
* **Query Parameters:** `productId`, `type`, `search`, `page`, `pageSize`

### 5.4 `GET /api/v1/transactions/:id`
Retrieves single immutable transaction details.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`

---

## 6. Dashboard & Reports Endpoints

### 6.1 `GET /api/v1/reports/summary`
Returns system KPI aggregates: total products, total stock units, low stock count, out of stock count, total valuation.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`

### 6.2 `GET /api/v1/reports/movement`
Returns aggregate stock-in vs. stock-out quantities grouped by product and time period.

* **Auth Required:** Yes
* **Allowed Roles:** `ADMIN`, `STAFF`

---

## 7. User Management Endpoints (Admin Only)

### 7.1 `GET /api/v1/users`
Lists all user accounts. (Role: `ADMIN`)

### 7.2 `POST /api/v1/users`
Provisions a new user account with temporary credentials and assigned role. (Role: `ADMIN`)
* **Request Body:** `{ "name": "Sara Ahmed", "email": "sara@company.com", "role": "STAFF", "temporaryPassword": "InitPassword1!" }`

### 7.3 `PATCH /api/v1/users/:id/role`
Modifies user role (`ADMIN` $\leftrightarrow$ `STAFF`). (Role: `ADMIN`)

### 7.4 `PATCH /api/v1/users/:id/status`
Activates or deactivates user account (`Active` $\leftrightarrow$ `Inactive`). (Role: `ADMIN`)
