# StockFlow — UI/UX, Interaction & Accessibility Audit

> **Document Version:** 1.0.0  
> **Status:** FORENSIC AUDIT  
> **Scope:** 15 Screen Views, Shared Layouts & UI Primitives  

---

## 1. Executive Summary & Design System Quality

The frontend was exported from a high-fidelity Figma Make design specification. Visually, the design is **modern, clean, highly professional, and operational**. It adheres to a cohesive B2B palette (`--color-navy: #1E293B`, `--color-primary: #2563EB`, custom semantic status colors for success, warning, danger, info) and employs consistent typography (Inter font family via Google Fonts).

However, because the code was exported as a prototype:
* Real asynchronous network loading states are missing (synchronous state renders immediately).
* Forms use local simulated timeouts (`setTimeout`) instead of real API mutation state.
* Some interactive elements lack keyboard accessibility attributes and ARIA linkages.

---

## 2. Screen-by-Screen Forensic Audit

### 2.1 Screen: Login (`src/pages/Login.tsx`)
* **Visual Polish:** Excellent. Centered card layout with logo, clean inputs, and password visibility toggle.
* **Functionality:** Validates email format and password presence. Shows demo credentials box.
* **Findings / Flaws:**
  * `login(email, password)` ignores password parameter completely.
  * No "Forgot Password" modal or workflow connected (link does nothing).
  * No rate-limiting feedback after multiple failed login attempts.
* **Status:** `PARTIAL` (Visuals Done, Real Auth Missing).

### 2.2 Screen: Dashboard (`src/pages/Dashboard.tsx`)
* **Visual Polish:** High. 4 KPI cards with status border accents, horizontal segmented bar chart (`InventoryStatusChart`), Recent Transactions table with direction icons (`ArrowUpRight`/`ArrowDownRight`), Low Stock alert table.
* **Functionality:** Accurately derives metrics from context (`totalProducts`, `totalStock`, `lowStock`, `outOfStock`, `inventoryValue`).
* **Findings / Flaws:**
  * Chart and metrics are calculated via synchronous client-side `.reduce()` calls on mock arrays.
  * No loading skeleton displayed on initial render.
* **Status:** `PARTIAL` (UI Complete, Needs API Feed).

### 2.3 Screen: Product Catalog (`src/pages/Products.tsx`)
* **Visual Polish:** High. Search bar, Category dropdown filter, Stock Status dropdown filter, Sort dropdown, paginated table, action menu dropdown (`...`).
* **Functionality:** Real-time client filtering and sorting. Archive confirmation dialog via `<Confirm />`.
* **Findings / Flaws:**
  * Action dropdown uses a fixed transparent overlay backdrop (`fixed inset-0 z-10`) which can cause click-trapping issues.
  * `deleteProduct` completely removes the product from the array instead of soft-deleting, leaving orphaned transactions.
  * Search and filters operate on client-side array; will degrade on datasets $> 1,000$ items.
* **Status:** `PARTIAL` (UI Complete, Needs Server-Side Pagination).

### 2.4 Screen: Product Detail (`src/pages/ProductDetail.tsx`)
* **Visual Polish:** High. Stock Summary progress bar, Quick Actions (Stock In / Stock Out links), Product Information grid, Transaction History table.
* **Functionality:** Breadcrumb back navigation, quick action deep links.
* **Findings / Flaws:**
  * Quick action buttons navigate to generic `/stock-in` and `/stock-out` without pre-selecting this product in the form dropdown.
* **Status:** `PARTIAL`.

### 2.5 Screen: Product Add / Edit Form (`src/pages/ProductForm.tsx`)
* **Visual Polish:** High. Clean two-column grid with labeled inputs and error text styling.
* **Functionality:** SKU duplication check (`skuExists`), positive price and reorder level validation, initial stock transaction creation on Add.
* **Findings / Flaws:**
  * When in `edit` mode, SKU is disabled (correct domain behavior), but initial stock field is omitted (correct).
  * Validation errors appear only upon form submission, not on blur.
* **Status:** `PARTIAL`.

### 2.6 Screen: Categories (`src/pages/Categories.tsx`)
* **Visual Polish:** Good. Table with product count badges, Add/Edit modal, Delete confirmation.
* **Functionality:** Duplicate name check, inline count calculation.
* **Findings / Flaws:**
  * Deleting a category does not reassign or nullify `categoryId` on existing products, causing broken category name displays (`'—'`).
* **Status:** `PARTIAL`.

### 2.7 Screen: Suppliers (`src/pages/Suppliers.tsx`)
* **Visual Polish:** Good. Contact info table, product count badges, Add/Edit modal.
* **Functionality:** Supplier CRUD with email format validation.
* **Findings / Flaws:**
  * Deleting a supplier does not nullify `supplierId` on products, causing orphaned foreign keys in in-memory state.
* **Status:** `PARTIAL`.

### 2.8 Screen: Inventory (`src/pages/Inventory.tsx`)
* **Visual Polish:** Excellent. KPI summary, quick Stock In / Stock Out header buttons, status filter pills (`All`, `In Stock`, `Low Stock`, `Out of Stock`), search, paginated table with valuation column.
* **Functionality:** Complete overview of stock levels across all catalog items.
* **Status:** `PARTIAL` (Ready for backend API).

### 2.9 Screen: Stock In (`src/pages/StockIn.tsx`)
* **Visual Polish:** Clean single-column form. Real-time preview card displaying current stock and projected stock after transaction.
* **Functionality:** Validates quantity $> 0$, records supplier and reference number. Success banner with auto-reset timer.
* **Status:** `PARTIAL` (Ready for backend API).

### 2.10 Screen: Stock Out (`src/pages/StockOut.tsx`)
* **Visual Polish:** Clean form with warning styles if out-of-stock. Real-time preview card displaying stock after deduction.
* **Functionality:** **Strict negative stock prevention in UI** (`qty > currentStock` triggers inline error `"Insufficient stock. Only X units available."` and disables submit button).
* **Findings / Flaws:**
  * Product select disables options with 0 stock (`disabled={s === 0}`), preventing user confusion.
* **Status:** `PARTIAL` (Ready for backend API).

### 2.11 Screen: Transactions Ledger (`src/pages/Transactions.tsx`)
* **Visual Polish:** High. Search bar, transaction type filter (`Stock In`, `Stock Out`, `Adjustment`), product filter, paginated data table.
* **Functionality:** Clicking any row navigates to `TransactionDetail`.
* **Findings / Flaws:**
  * Correctly omits any Edit or Delete buttons (respects immutability).
* **Status:** `PARTIAL`.

### 2.12 Screen: Transaction Detail (`src/pages/TransactionDetail.tsx`)
* **Visual Polish:** High. Clean definition list format (`<dl>`, `<dt>`, `<dd>`) showing previous stock, quantity moved, new stock, performed by user, timestamp, reference, and supplier.
* **Functionality:** Clear indicator: *"Read-only record — transactions are immutable."*
* **Status:** `PARTIAL`.

### 2.13 Screen: Reports (`src/pages/Reports.tsx`)
* **Visual Polish:** High. Tab navigation (`Inventory Summary`, `Stock Movement`, `Low Stock Report`, `Inventory Value`). CSS-based horizontal dual bar chart for Stock In vs. Stock Out comparison.
* **Functionality:** Calculates net movement (`totalIn - totalOut`), top value products, percentage of total inventory value.
* **Status:** `PARTIAL` (Needs database aggregation endpoints).

### 2.14 Screen: User Management (`src/pages/Users.tsx`)
* **Visual Polish:** High. User list with avatars, role badges, status badges, last activity timestamps.
* **Functionality:** Add user modal, Edit user modal, Role modification warning modal, Deactivation confirmation modal. Access Denied guard if Staff role.
* **Findings / Flaws:**
  * Currently Staff can bypass `<AccessDenied />` if they modify local React state in React DevTools.
* **Status:** `PARTIAL` (UI Complete, Needs Server-Side RBAC).

### 2.15 Screen: Settings (`src/pages/Settings.tsx`)
* **Visual Polish:** Good. Profile section, Change Password section with validation (minimum 8 characters, confirmation matching), Preferences section (Theme toggle, email/low-stock notifications).
* **Findings / Flaws:**
  * Clicking "Save Profile", "Change Password", or "Save Preferences" merely shows a success toast. It does not update state or persist changes anywhere.
* **Status:** `MOCKED`.

---

## 3. Layout & Global Component Audit

### 3.1 Header (`src/components/Header.tsx`)
* **Breadcrumbs:** Correctly maps `currentPage` to hierarchical labels (`Products / Add Product`).
* **Global Search Dropdown:** Typeahead search filtering products by name or SKU, showing live stock level and navigating to detail on click.
* **Notifications Dropdown:** Lists unread notifications with timestamps and "Mark all read" action.

### 3.2 Sidebar (`src/components/Sidebar.tsx`)
* **Navigation Links:** Highlight active item accurately with `bg-primary/20 text-white`.
* **Admin Section:** Conditionally renders "Users" navigation link for `ADMIN` users only.
* **Logout Button:** Invokes `logout()`.

### 3.3 UI Primitives (`src/components/ui.tsx`)
* Contains reusable primitives: `Badge`, `KPICard`, `EmptyState`, `SkeletonRow`, `SkeletonCard`, `Confirm`, `FormField`, `Pagination`, `PageHeader`, `StatusDot`.
* **Evaluation:** Highly reusable, clean design tokens, consistent border and padding conventions.

---

## 4. Accessibility (a11y) & Responsive Audit

1. **Keyboard Accessibility:**
   * Modals listen for the `Escape` key (`keydown` listener in `src/components/Modal.tsx`).
   * Forms submit on `Enter`.
   * *Gap:* Focus trapping within open modal dialogs is not implemented.
2. **Screen Reader Support:**
   * Modals include `role="dialog"` and `aria-modal="true"`.
   * *Gap:* Form inputs lack explicit `aria-describedby` linking to error message elements.
   * *Gap:* Data tables lack explicit `scope="col"` on table header `<th>` elements.
3. **Responsive Breakpoints:**
   * Desktop ($> 1280\text{px}$): Optimal. Multi-column grids and wide data tables render cleanly.
   * Tablet ($768\text{px} - 1024\text{px}$): Grids drop to 2 columns; table containers feature horizontal scrolling (`overflow-x-auto`).
   * Mobile ($< 768\text{px}$): Sidebar is currently fixed at `w-60` without a mobile hamburger toggle menu. On narrow mobile screens, horizontal viewport squeeze occurs.
   * *Recommendation:* Add mobile drawer toggle for Sidebar on screens $< 768\text{px}$.
