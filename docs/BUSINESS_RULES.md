# StockFlow — Business Domain Rules & Invariants

> **Document Version:** 1.0.0  
> **Status:** AUTHORITATIVE DOMAIN SPECIFICATION  
> **Target System:** StockFlow Inventory Management System  

---

## 1. Product Catalog Rules

| Rule ID | Domain Entity | Invariant / Validation Rule | Violation Handling |
| :--- | :--- | :--- | :--- |
| `BR-PROD-001` | Product | **Product Name Required:** Must be non-empty string, 2–150 characters. | Form validation error & HTTP 400. |
| `BR-PROD-002` | Product | **SKU Format & Uniqueness:** SKU must be unique across all active and archived products (case-insensitive). Characters allowed: alphanumeric and hyphens (`[A-Z0-9-]+`). Auto-trimmed and uppercase-normalized. | Reject with `"SKU already exists."` (HTTP 409 Conflict). |
| `BR-PROD-003` | Product | **SKU Immutability:** Once created, a product's SKU cannot be modified via edit endpoints. | Read-only in UI, ignored or rejected if present in `PUT /api/v1/products/:id`. |
| `BR-PROD-004` | Product | **Unit Price Invariant:** Must be a non-negative decimal (`price >= 0.00`). | Form error & HTTP 422. |
| `BR-PROD-005` | Product | **Reorder Level Invariant:** Must be a non-negative integer (`reorderLevel >= 0`). | Form error & HTTP 422. |
| `BR-PROD-006` | Product | **Category Association:** Must reference a valid, non-archived `categoryId`. | Reject with HTTP 400. |
| `BR-PROD-007` | Product | **Initial Stock Provisioning:** When adding a product with `initialStock > 0`, the system must atomically create an initial `Stock In` transaction with reference `'INIT'`. | Atomic transaction in DB. |

---

## 2. Inventory Calculation & Stock Status Rules

### 2.1 Inventory Movement Formulas
* **Stock-In Operations:**
  $$\text{newStock} = \text{currentStock} + \text{quantity} \quad (\text{where } \text{quantity} > 0)$$
* **Stock-Out Operations:**
  $$\text{newStock} = \text{currentStock} - \text{quantity} \quad (\text{where } \text{quantity} > 0 \land \text{currentStock} \ge \text{quantity})$$
* **Inventory Adjustment Operations:**
  $$\text{newStock} = \text{adjustedQuantity} \quad (\text{where } \text{adjustedQuantity} \ge 0)$$

### 2.2 Strict Negative Stock Prevention (`BR-INV-001`)
* Under **no circumstance** may current stock become negative.
* If $\text{quantity} > \text{currentStock}$:
  * The operation **MUST abort immediately**.
  * User-facing message: `"Insufficient stock. Only [X] units are available."`
  * No database modification is performed.

### 2.3 Derived Product Stock Status (`BR-INV-002`)
Stock status is never manually edited; it is dynamically evaluated according to the following truth table:

| Stock Level Condition | Derived Status | UI Badge Style | Dashboard Classification |
| :--- | :--- | :--- | :--- |
| $\text{quantity} > \text{reorderLevel}$ | `IN_STOCK` (`'In Stock'`) | Green / Success | Healthy Inventory |
| $\text{quantity} \le \text{reorderLevel} \land \text{quantity} > 0$ | `LOW_STOCK` (`'Low Stock'`) | Amber / Warning | Low Stock Alert List |
| $\text{quantity} = 0$ | `OUT_OF_STOCK` (`'Out of Stock'`) | Red / Danger | Critical Alert List |

---

## 3. Transactional Integrity & Atomicity (`BR-TXN-001`)

Every physical inventory movement must adhere to strict ACID transaction semantics:

```
[START DATABASE TRANSACTION (SERIALIZABLE or READ COMMITTED with ROW LOCK)]
   │
   ├── 1. Authenticate and authorize requesting user (Admin/Staff).
   ├── 2. SELECT * FROM products WHERE id = :productId FOR UPDATE;
   │      - If product not found -> ROLLBACK -> Throw NotFound.
   │      - If product.is_archived -> ROLLBACK -> Throw InactiveProduct.
   │
   ├── 3. For Stock-Out: Verify product.quantity >= :quantity.
   │      - If false -> ROLLBACK -> Throw InsufficientStockException.
   │
   ├── 4. Calculate new_stock.
   ├── 5. UPDATE products SET quantity = :new_stock, updated_at = NOW() WHERE id = :productId;
   │
   ├── 6. INSERT INTO stock_transactions (
   │         id, product_id, type, quantity, previous_stock, new_stock,
   │         user_id, supplier_id, reference, notes, created_at
   │      ) VALUES (
   │         :uuid, :productId, :type, :quantity, :previousStock, :new_stock,
   │         :userId, :supplierId, :reference, :notes, NOW()
   │      );
   │
   └── 7. COMMIT TRANSACTION.
[IF ANY STEP FAILS: ROLLBACK ALL CHANGES AUTOMATICALLY]
```

* **Invariant:** An inventory quantity change without a matching `stock_transactions` record is impossible.
* **Invariant:** A `stock_transactions` record without an actual inventory quantity change is impossible.

---

## 4. Immutability & Audit Trail Rules (`BR-AUD-001`)

1. **Transactions Are Permanent:**
   * Historical `stock_transactions` records are **strictly append-only**.
   * No `UPDATE` or `DELETE` operations or API endpoints exist for transactions.
   * If a human mistake occurs during Stock-In, the correction must be executed as an offsetting `Adjustment` or `Stock Out` transaction with explanatory notes.
2. **Audit Logging:**
   * Critical administrative operations (User Creation, Role Promotion/Demotion, User Deactivation, Product Archival) record an immutable entry in `audit_logs`.

---

## 5. Deletion & Archival Lifecycle Rules (`BR-CAT-001`)

1. **Products:**
   * Archiving a product (`is_archived = TRUE`) hides it from the default catalog, inventory search, and transaction dropdowns.
   * Existing transaction history and inventory valuation historical records remain linked and intact.
2. **Categories:**
   * Categories containing active products cannot be hard-deleted (`ON DELETE RESTRICT`).
   * When a category is archived, associated products must either be reassigned or preserve the category reference in historical views.
3. **Suppliers:**
   * Suppliers associated with products or transactions cannot be hard-deleted. Archival sets `is_archived = TRUE` while preserving supplier history on previous purchase orders.

---

## 6. Concurrency Control & Race Condition Rules (`BR-CONC-001`)

### Scenario: Simultaneous Stock-Out
* **Initial State:** Product `p1` current stock = `10` units.
* **Actor A:** Requests Stock-Out of `7` units at `10:00:00.100`.
* **Actor B:** Requests Stock-Out of `7` units at `10:00:00.105`.

### Naive Implementation Failure (Without Concurrency Control):
1. Thread A reads stock: `10`. Checks $10 \ge 7$ (Passes).
2. Thread B reads stock: `10`. Checks $10 \ge 7$ (Passes).
3. Thread A writes stock: $10 - 7 = 3$.
4. Thread B writes stock: $3 - 7 = -4$ (or overwrites with $10 - 7 = 3$, leading to double-allocation).
5. **Result: Data Corruption & Negative Stock.**

### Production Solution: Pessimistic Row Locking + Atomic SQL Updates
```sql
-- Solution Option A: Pessimistic Locking in Transaction
BEGIN;
SELECT quantity FROM products WHERE id = 'p1' FOR UPDATE;
-- Thread B waits here until Thread A commits or aborts.
-- Thread A evaluates 10 >= 7 -> Updates quantity = 3 -> Inserts transaction -> Commits.
-- Thread B acquires lock -> Evaluates 3 >= 7 -> Fails -> Aborts and returns 422.
COMMIT;

-- Solution Option B: Single Atomic SQL Update with Row Count Verification
UPDATE products
SET quantity = quantity - 7, updated_at = NOW()
WHERE id = 'p1' AND quantity >= 7 AND is_archived = FALSE;
-- If affected_rows == 1: Proceed to insert transaction.
-- If affected_rows == 0: Raise InsufficientStockException and rollback.
```

---

## 7. User Account & Lifecycle Rules (`BR-USER-001`)

1. **Unique Email Invariant:** Every user account email must be globally unique.
2. **Deactivation Invariant:** Inactive users (`status = 'Inactive'`) cannot log in. If a user is active and gets deactivated while holding an active session, their session is invalidated immediately on their next request.
3. **Last Admin Protection:** The system will reject any attempt to deactivate or demote the last remaining active `ADMIN` account.
