# StockFlow — Quality Assurance & Test Plan Specification

> **Document Version:** 1.0.0  
> **Status:** SPECIFICATION / TEST MATRIX  
> **Target Coverage:** $\ge 85\%$ Branch & Business Logic Coverage  

---

## 1. Quality Strategy & Testing Pyramid

In the current codebase, **0 automated tests exist**.

To transition StockFlow into a production-grade system, testing must be structured across 4 distinct layers:

```
                  ┌─────────────────────┐
                  │     E2E Tests       │  (Playwright)
                  │   Core Workflows    │  • Full browser flow (Login -> Stock Out -> Report)
                  └──────────┬──────────┘
                             │
                  ┌──────────┴──────────┐
                  │  Integration Tests  │  (Vitest + Supertest / Fastify Inject)
                  │  API & Transactions │  • REST Endpoints, DB Transactions, RBAC Guards
                  └──────────┬──────────┘
                             │
                  ┌──────────┴──────────┐
                  │   Component Tests   │  (Vitest + React Testing Library)
                  │  UI States & Forms  │  • Form validations, Modals, Pagination
                  └──────────┬──────────┘
                             │
                  ┌──────────┴──────────┐
                  │     Unit Tests      │  (Vitest)
                  │ Domain Logic & Math │  • Stock status formulas, Invariants, DTO validation
                  └─────────────────────┘
```

---

## 2. Ten Mandatory Business Scenario Test Cases

### Test 1: Admin Can Create Product
* **Test Type:** Integration / API & UI
* **Preconditions:** Authenticated as `ADMIN`.
* **Execution:**
  1. Submit `POST /api/v1/products` with valid payload (name, unique SKU, categoryId, price: 50.00, initialStock: 10, reorderLevel: 5).
* **Expected Assertions:**
  * Response status `201 Created`.
  * Product row inserted into database with `quantity = 10`.
  * One `Stock In` transaction inserted into `stock_transactions` with `quantity = 10`, `reference = 'INIT'`.
  * Status evaluated as `In Stock`.

### Test 2: Staff Cannot Access User Management
* **Test Type:** Security / RBAC Guard Test
* **Preconditions:** Authenticated as `STAFF`.
* **Execution:**
  1. Client: Attempt navigating to `/users`.
  2. API: Submit `GET /api/v1/users` and `POST /api/v1/users`.
* **Expected Assertions:**
  * Client UI displays `<AccessDenied />` error card; "Users" tab omitted from sidebar.
  * API endpoints return HTTP `403 Forbidden` with `{ "error": "Forbidden" }`.
  * Zero user accounts exposed or mutated.

### Test 3: Duplicate SKU Is Rejected
* **Test Type:** Data Integrity & Validation Test
* **Preconditions:** Product exists with SKU `'WM-001'`.
* **Execution:**
  1. Submit `POST /api/v1/products` with SKU `'wm-001'` (case-insensitive test) and different name.
* **Expected Assertions:**
  * Response status `409 Conflict`.
  * Error body contains `{ "field": "sku", "message": "SKU already exists." }`.
  * Database contains exactly 1 product with that SKU.

### Test 4: Stock-In Increases Stock
* **Test Type:** Inventory Transaction Test
* **Preconditions:** Product exists with current stock = 10.
* **Execution:**
  1. Submit `POST /api/v1/inventory/stock-in` with `productId`, `quantity: 5`, `reference: "PO-100"`.
* **Expected Assertions:**
  * Response status `201 Created`.
  * Product's new stock in database equals `15`.
  * Transaction record inserted with `previous_stock = 10`, `quantity = 5`, `new_stock = 15`, `type = 'Stock In'`.

### Test 5: Stock-Out Decreases Stock
* **Test Type:** Inventory Transaction Test
* **Preconditions:** Product exists with current stock = 15.
* **Execution:**
  1. Submit `POST /api/v1/inventory/stock-out` with `productId`, `quantity: 5`, `reference: "SO-200"`.
* **Expected Assertions:**
  * Response status `201 Created`.
  * Product's new stock in database equals `10`.
  * Transaction record inserted with `previous_stock = 15`, `quantity = 5`, `new_stock = 10`, `type = 'Stock Out'`.

### Test 6: Stock-Out Cannot Make Stock Negative
* **Test Type:** Negative Boundary & Domain Invariant Test
* **Preconditions:** Product exists with current stock = 5.
* **Execution:**
  1. Submit `POST /api/v1/inventory/stock-out` with `quantity: 10`.
* **Expected Assertions:**
  * Response status `422 Unprocessable Entity` (or `400 Bad Request`).
  * Error message: `"Insufficient stock. Only 5 units are available."`
  * Product stock remains unchanged at `5`.
  * Zero transaction records inserted.

### Test 7: Stock Transaction and Inventory Update are Atomic (Rollback Test)
* **Test Type:** ACID Transaction Fault Injection
* **Preconditions:** Mock database failure on transaction insert step.
* **Execution:**
  1. Start Stock-In. Update product quantity from 10 to 20.
  2. Force synthetic failure / constraint error during `stock_transactions` insert.
* **Expected Assertions:**
  * Transaction aborts and issues `ROLLBACK`.
  * Product stock in database reverts to `10` (no orphan quantity update).
  * No partial records exist in any table.

### Test 8: Unauthorized Users Cannot Perform Stock Operations
* **Test Type:** Authentication Security Test
* **Preconditions:** Unauthenticated request (no cookie/token).
* **Execution:**
  1. Issue `POST /api/v1/inventory/stock-in` and `POST /api/v1/inventory/stock-out`.
* **Expected Assertions:**
  * Response status `401 Unauthorized`.
  * Zero state changes in database.

### Test 9: Deactivated User Cannot Authenticate
* **Test Type:** Authentication Lifecycle Test
* **Preconditions:** User exists with `status = 'Inactive'`.
* **Execution:**
  1. Submit `POST /api/v1/auth/login` with correct password for inactive user.
* **Expected Assertions:**
  * Response status `403 Forbidden`.
  * Error message: `"This account has been deactivated. Contact your administrator."`
  * No session token issued.

### Test 10: Product Status Transitions
* **Test Type:** Unit / Domain State Machine Test
* **Preconditions:** Product with `reorderLevel = 10`.
* **Execution & Assertions:**
  * When `quantity = 15` $\rightarrow$ Evaluates to `'In Stock'`.
  * When `quantity = 10` $\rightarrow$ Evaluates to `'Low Stock'`.
  * When `quantity = 1` $\rightarrow$ Evaluates to `'Low Stock'`.
  * When `quantity = 0` $\rightarrow$ Evaluates to `'Out of Stock'`.

---

## 3. Concurrency & Race Condition Test Suite

```typescript
// Example Concurrency Test in Vitest
it('prevents double-allocation during concurrent stock-outs', async () => {
  // Setup: Product with 10 units
  const product = await createTestProduct({ initialStock: 10 });

  // Execute two simultaneous stock-out requests of 7 units each
  const [reqA, reqB] = await Promise.allSettled([
    clientA.post('/api/v1/inventory/stock-out', { productId: product.id, quantity: 7 }),
    clientB.post('/api/v1/inventory/stock-out', { productId: product.id, quantity: 7 })
  ]);

  // Exactly one must succeed, and one must fail with Insufficient Stock
  const succeeded = [reqA, reqB].filter(r => r.status === 'fulfilled' && r.value.status === 201);
  const failed = [reqA, reqB].filter(r => r.status === 'fulfilled' && r.value.status === 422);

  expect(succeeded.length).toBe(1);
  expect(failed.length).toBe(1);

  // Final stock must be exactly 3, not -4
  const updated = await getProduct(product.id);
  expect(updated.currentStock).toBe(3);
});
```

---

## 4. Test Tooling & Scripts Configuration

### Recommended `package.json` Test Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```
