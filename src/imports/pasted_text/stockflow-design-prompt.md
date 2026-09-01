# FIGMA DESIGN PROMPT — STOCKFLOW

## Inventory & Operations Management System

Design a complete, production-ready **web-based Inventory Management System** called **StockFlow**.

This is a real software engineering evaluation project. The design must prioritize usability, clarity, operational workflows, data integrity, role-based access, and realistic business operations over decorative visuals.

The final Figma file must represent the complete application from authentication through inventory management, stock transactions, reporting, user management, and logout.

---

# 1. PRODUCT PURPOSE

StockFlow is an internal inventory and operations management application for a small-to-medium business.

The application allows authorized employees to:

* Manage products
* Manage categories
* Manage suppliers
* Monitor inventory
* Record stock-in transactions
* Record stock-out transactions
* Prevent invalid stock operations
* Identify low-stock and out-of-stock products
* View inventory reports
* Review transaction history
* Manage users and permissions

The system has two primary roles:

### ADMIN

Full system access.

Admin can:

* View dashboard
* Manage products
* Manage categories
* Manage suppliers
* Record stock movements
* View all reports
* View transaction history
* Manage users
* Change user roles
* Deactivate users

### STAFF

Operational access.

Staff can:

* View dashboard
* View/search products
* View categories
* View suppliers
* Record stock-in
* Record stock-out
* View inventory
* View transaction history
* View operational reports

Staff cannot:

* Manage users
* Change roles
* Deactivate users
* Delete critical system data
* Access administrative settings

The UI must reflect these permissions.

Do NOT merely hide functionality visually. Design the application assuming authorization is enforced by the backend as well.

---

# 2. DESIGN DIRECTION

Create a professional B2B SaaS-style dashboard.

Visual personality:

* Clean
* Professional
* Modern
* Reliable
* Operational
* Minimal
* Data-focused
* Easy to scan
* Suitable for daily business use

Avoid:

* Excessive gradients
* Excessive glassmorphism
* Huge decorative illustrations
* Excessive animations
* Gaming-style interfaces
* Overly rounded cartoon-like components
* Excessive shadows
* Unnecessary visual clutter

The application should look like software that a real operations team would use every day.

---

# 3. COLOR SYSTEM

Use a restrained professional color system.

Primary:

* Deep Navy: #1E293B
* Primary Blue: #2563EB

Success:

* Green: #16A34A

Warning:

* Amber: #D97706

Danger:

* Red: #DC2626

Background:

* #F8FAFC

Surface:

* #FFFFFF

Primary Text:

* #0F172A

Secondary Text:

* #64748B

Borders:

* #E2E8F0

Use semantic colors consistently.

Green = healthy/success

Amber = warning/low stock

Red = error/danger/out of stock

Blue = primary actions/information

---

# 4. TYPOGRAPHY

Use a clean modern sans-serif font such as:

Inter

Typography hierarchy:

* Page title: 28px / semibold
* Section title: 20px / semibold
* Card title: 16px / semibold
* Body: 14–16px
* Secondary text: 13–14px
* Table text: 14px
* Caption: 12px

Maintain strong hierarchy and readability.

---

# 5. RESPONSIVE DESIGN

Design primarily for desktop because this is an internal operations dashboard.

Primary frame:

1440 × 1024

Also create responsive examples for:

* 1280px desktop
* 1024px tablet/smaller desktop
* 768px tablet

The application must be usable without horizontal scrolling.

On smaller screens:

* Sidebar collapses
* Tables become horizontally scrollable or transform into cards where appropriate
* Filters wrap
* Forms become single-column
* Dashboard cards stack

---

# 6. GLOBAL APPLICATION LAYOUT

After authentication, use this layout:

LEFT SIDEBAR
+
TOP HEADER
+
MAIN CONTENT AREA

Sidebar:

StockFlow logo

Navigation:

* Dashboard
* Products
* Categories
* Suppliers
* Inventory
* Transactions
* Reports

Admin-only section:

* Users

Bottom of sidebar:

* Settings
* Logout

Top header:

* Breadcrumb
* Search
* Notification icon
* Current user avatar
* User name
* Role badge

Example:

Ahmad
Administrator

The sidebar must show the active navigation item clearly.

---

# 7. SCREEN 01 — LOGIN

Create a professional login page.

Layout:

Centered authentication card.

Logo:

StockFlow

Heading:

"Welcome back"

Subtitle:

"Sign in to manage your inventory and operations."

Fields:

Email
Password

Password visibility toggle.

Remember me checkbox.

Primary button:

"Sign In"

Secondary:

"Forgot password?"

Include validation states.

Examples:

Empty email:

"Email is required"

Invalid email:

"Enter a valid email address"

Incorrect credentials:

"Invalid email or password"

Loading state:

"Signing in..."

Disable the button while loading.

---

# 8. LOGIN DATA FLOW

The login screen collects:

email
password

On successful authentication, backend returns:

user ID
name
email
role
authentication/session information

The application then redirects to:

Dashboard

The role determines available navigation and permissions.

Example:

role = ADMIN

Show:

Users

role = STAFF

Do not show:

Users

---

# 9. SCREEN 02 — DASHBOARD

Create the primary operational dashboard.

Heading:

"Dashboard"

Subtitle:

"Overview of your inventory and recent activity."

Top KPI cards:

1. Total Products
2. Total Stock Units
3. Low Stock Items
4. Out of Stock Items

Each card contains:

* Label
* Main number
* Small contextual indicator
* Optional icon

Example:

Total Products
248

Low Stock Items
17
"Needs attention"

Out of Stock
5

---

# 10. DASHBOARD DATA

The dashboard receives aggregated data from the backend.

Example conceptual response:

dashboard:

totalProducts
totalStockUnits
lowStockProducts
outOfStockProducts
inventoryValue

recentTransactions
lowStockProducts

Do not display raw database fields unnecessarily.

The UI should display business-friendly information.

---

# 11. DASHBOARD — INVENTORY STATUS

Create a section:

"Inventory Status"

Show:

* Healthy Stock
* Low Stock
* Out of Stock

Use a simple chart or visual summary.

Do not over-design the chart.

---

# 12. DASHBOARD — RECENT TRANSACTIONS

Create a table:

Recent Transactions

Columns:

Product
SKU
Type
Quantity
Performed By
Date
Status

Transaction types:

Stock In
Stock Out
Adjustment

Use semantic badges.

Stock In = green

Stock Out = blue

Adjustment = amber

---

# 13. DASHBOARD — LOW STOCK

Create:

"Low Stock Items"

Table:

Product
SKU
Current Stock
Reorder Level
Status
Action

Example:

Wireless Mouse
WM-001
4
10
Low Stock
View

Provide:

"View All"

---

# 14. SCREEN 03 — PRODUCTS

Create a complete product management screen.

Heading:

"Products"

Top right:

"+ Add Product"

Toolbar:

Search products

Filter by:

Category
Stock status

Sort by:

Name
Stock quantity
Created date

Main table:

Product
SKU
Category
Price
Stock
Reorder Level
Status
Actions

Actions:

View
Edit
Delete

Use a three-dot action menu.

---

# 15. PRODUCT STATUS

Product status is derived from inventory quantity.

Examples:

If quantity > reorder level:

"In Stock"

If quantity > 0 but quantity <= reorder level:

"Low Stock"

If quantity = 0:

"Out of Stock"

Represent these with semantic badges.

---

# 16. SCREEN 04 — ADD PRODUCT

Create an Add Product form.

Fields:

Product Name *
SKU *
Category *
Supplier
Price *
Initial Stock *
Reorder Level *
Description

Buttons:

Cancel

Create Product

Show required field indicators.

Validation:

Product name required

SKU required

SKU must be unique

Price must be >= 0

Initial stock must be >= 0

Reorder level must be >= 0

---

# 17. ADD PRODUCT DATA FLOW

When submitted:

Frontend sends:

name
sku
categoryId
supplierId
price
initialStock
reorderLevel
description

Backend creates the product.

If initialStock > 0:

Create the initial inventory record/stock transaction as part of the appropriate database transaction.

The UI then:

* Shows success notification
* Returns to Products
* Displays newly created product

If SKU already exists:

Show:

"SKU already exists."

Do not clear the user's entire form.

---

# 18. SCREEN 05 — PRODUCT DETAILS

Create a detailed Product Details screen.

Header:

Product name

SKU

Status badge

Actions:

Edit
Delete

Information cards:

Current Stock

Reorder Level

Unit Price

Category

Supplier

Created Date

Description

---

# 19. PRODUCT DETAILS — STOCK SUMMARY

Show:

Current Stock

Reorder Level

Stock Status

Total Stock In

Total Stock Out

Create a visual stock indicator.

Example:

Current Stock: 45

Reorder Level: 20

Status: In Stock

---

# 20. PRODUCT DETAILS — TRANSACTION HISTORY

Table:

Date
Transaction Type
Quantity
Previous Stock
New Stock
Performed By
Reference

This allows users to understand exactly how inventory changed.

---

# 21. SCREEN 06 — EDIT PRODUCT

Use the same form structure as Add Product.

Editable:

Name
Category
Supplier
Price
Reorder Level
Description

SKU should either be immutable or require special handling.

Do NOT casually allow changing SKU because it acts as an inventory identifier.

Buttons:

Cancel

Save Changes

Show:

Saving...

Success:

"Product updated successfully."

---

# 22. DELETE PRODUCT CONFIRMATION

When Delete is selected:

Show modal.

Title:

"Delete Product?"

Message:

"Are you sure you want to delete this product? This action may affect inventory records."

Buttons:

Cancel

Delete Product

Use danger styling.

For products with transaction history, prefer:

"Archive Product"

rather than destructive deletion.

Design both states.

---

# 23. SCREEN 07 — CATEGORIES

Create Categories management.

Header:

"Categories"

Button:

"+ Add Category"

Table:

Category Name
Products
Created Date
Actions

Actions:

Edit
Delete

Add Category modal:

Category Name

Buttons:

Cancel
Create Category

Validation:

Category name required

Category name must be unique

---

# 24. SCREEN 08 — SUPPLIERS

Create Suppliers management.

Header:

"Suppliers"

Button:

"+ Add Supplier"

Table:

Supplier
Contact
Email
Phone
Products
Actions

Add Supplier form:

Supplier Name *
Email
Phone
Address

Buttons:

Cancel
Create Supplier

Validation:

Supplier name required

Email must be valid if supplied

---

# 25. SCREEN 09 — INVENTORY

Create a dedicated inventory monitoring page.

Heading:

"Inventory"

Show summary cards:

Total Stock Units

Low Stock

Out of Stock

Inventory Value

Toolbar:

Search

Filter:

All
In Stock
Low Stock
Out of Stock

Table:

Product
SKU
Category
Current Stock
Reorder Level
Unit Price
Inventory Value
Status

Inventory Value:

Current Stock × Unit Price

Do not allow users to directly edit current stock from this table.

Inventory quantity changes only through stock transactions.

---

# 26. SCREEN 10 — STOCK IN

Create a Stock In workflow.

Heading:

"Stock In"

Form:

Product *
Quantity *
Supplier
Reference
Notes

Show selected product information:

Current Stock: 20

After Transaction:

30

Primary button:

"Add Stock"

Before submission:

Validate quantity > 0.

On success:

Stock increases.

A stock transaction is recorded.

Both changes must be treated as one atomic business operation.

---

# 27. STOCK IN DATA FLOW

Frontend submits:

productId
quantity
supplierId
reference
notes

Backend performs:

1. Verify authenticated user
2. Verify user has permission
3. Verify product exists
4. Verify quantity > 0
5. Begin database transaction
6. Read current stock
7. Increase stock
8. Create transaction record
9. Commit transaction

If any operation fails:

Rollback the entire transaction.

Show:

"Unable to complete stock-in operation."

Do not partially update inventory.

---

# 28. SCREEN 11 — STOCK OUT

Create a Stock Out workflow.

Fields:

Product *
Quantity *
Reference
Notes

Display:

Current Stock: 20

After Transaction: 15

Primary:

"Remove Stock"

Validation:

Quantity must be > 0

Quantity cannot exceed current stock

If user enters:

25

while stock is:

20

Show:

"Insufficient stock. Only 20 units are available."

Prevent submission.

---

# 29. STOCK OUT DATA FLOW

Frontend submits:

productId
quantity
reference
notes

Backend:

1. Authenticate user
2. Check authorization
3. Verify product
4. Verify quantity > 0
5. Verify available stock
6. Begin database transaction
7. Decrease stock
8. Create transaction record
9. Commit

If stock is insufficient:

Do not modify inventory.

---

# 30. SCREEN 12 — TRANSACTIONS

Create a complete transaction history page.

Heading:

"Transactions"

Filters:

Date range

Transaction type:

All
Stock In
Stock Out
Adjustment

Product

Performed By

Search reference

Table:

Date
Product
SKU
Type
Quantity
Previous Stock
New Stock
Performed By
Reference

Provide pagination.

---

# 31. TRANSACTION DETAILS

Clicking a transaction opens details.

Show:

Transaction ID

Product

SKU

Type

Quantity

Previous Stock

New Stock

Performed By

Timestamp

Reference

Notes

This screen is read-only.

Historical transactions should not be casually editable.

---

# 32. SCREEN 13 — REPORTS

Create a useful reporting page.

Heading:

"Reports"

Report cards:

Inventory Summary

Low Stock Report

Stock Movement Report

Inventory Value

---

# 33. INVENTORY SUMMARY REPORT

Show:

Total Products

Total Units

Inventory Value

Low Stock Products

Out of Stock Products

Table:

Product
Category
Current Stock
Unit Price
Inventory Value
Status

---

# 34. STOCK MOVEMENT REPORT

Filters:

Date range

Product

Transaction type

Show summary:

Total Stock In

Total Stock Out

Net Movement

Main table:

Date
Product
Type
Quantity
Performed By

Include a simple chart showing stock movement over time.

Keep it readable and business-oriented.

---

# 35. SCREEN 14 — USERS — ADMIN ONLY

This page must only be accessible to ADMIN.

Heading:

"Users"

Button:

"+ Add User"

Table:

Name
Email
Role
Status
Created
Last Activity
Actions

Roles:

Admin
Staff

Status:

Active
Inactive

Actions:

Edit

Change Role

Deactivate

---

# 36. ADD USER

Form:

Name *
Email *
Role *
Temporary Password *

Buttons:

Cancel
Create User

Do not display actual passwords after creation.

---

# 37. EDIT USER

Allow Admin to modify:

Name
Role
Status

Show confirmation for sensitive actions.

Example:

"Change role from Staff to Admin?"

Buttons:

Cancel

Confirm Change

---

# 38. DEACTIVATE USER

Confirmation modal:

"Deactivate User?"

Message:

"This user will no longer be able to sign in."

Buttons:

Cancel

Deactivate

Do not permanently delete historical user references from transactions.

---

# 39. ROLE-BASED UI

ADMIN sees:

Dashboard
Products
Categories
Suppliers
Inventory
Transactions
Reports
Users
Settings

STAFF sees:

Dashboard
Products
Categories
Suppliers
Inventory
Transactions
Reports
Settings

STAFF does NOT see:

Users

Staff should also not see destructive administrative controls.

Create both Admin and Staff navigation examples in Figma.

---

# 40. SETTINGS

Create a simple Settings page.

Sections:

Profile

Name

Email

Role

Account

Change Password

Preferences

Theme

Notifications

Do not over-engineer this page.

---

# 41. GLOBAL SEARCH

Create a global search interaction.

Search products by:

Name

SKU

Category

Results should show:

Product name
SKU
Current stock
Status

Clicking a result opens Product Details.

---

# 42. NOTIFICATIONS

Create notification dropdown.

Examples:

"Wireless Mouse is low on stock."

"Stock-in completed successfully."

"Stock-out completed successfully."

"New user created."

"Failed to complete transaction."

Notifications should have:

Unread/read state.

---

# 43. TOAST NOTIFICATIONS

Create reusable toast components.

Success:

"Product created successfully."

Error:

"Unable to delete product."

Warning:

"Stock level is below reorder level."

Info:

"Report generated."

---

# 44. LOADING STATES

Every asynchronous page must have loading states.

Examples:

Dashboard skeleton

Table skeleton

Button loading

Form loading

Product details loading

Do not leave empty white space during data loading.

---

# 45. EMPTY STATES

Create empty states for:

No products

No categories

No suppliers

No transactions

No low-stock products

No users

Example:

"No products found"

"Add your first product to start managing inventory."

Primary action:

"Add Product"

---

# 46. ERROR STATES

Create:

Network error

Unauthorized

Forbidden

Not found

Server error

Examples:

403:

"You don't have permission to access this page."

404:

"Product not found."

500:

"Something went wrong. Please try again."

---

# 47. DATA RELATIONSHIPS

The UI should reflect these relationships:

User

can create

StockTransaction

Product

belongs to

Category

Product

may belong to

Supplier

Product

has many

StockTransactions

Category

has many

Products

Supplier

has many

Products

StockTransaction

belongs to

Product

StockTransaction

belongs to

User

---

# 48. IMPORTANT INVENTORY BUSINESS RULE

Current stock must never be treated as an arbitrary UI value.

Inventory changes through controlled operations:

STOCK IN:

newStock = currentStock + quantity

STOCK OUT:

newStock = currentStock - quantity

ADJUSTMENT:

newStock = adjusted quantity

Every change creates a transaction history record.

---

# 49. BUSINESS INVARIANTS

Design the application around these rules:

1. Stock cannot become negative.

2. Stock transaction quantity must be greater than zero.

3. Product SKU must be unique.

4. Category names should be unique.

5. Only authorized users can perform stock operations.

6. Only Admin can manage users.

7. Historical transactions should be immutable.

8. Inventory updates and transaction records must succeed or fail together.

9. Deactivated users cannot authenticate.

10. Staff cannot escalate their own permissions.

---

# 50. IMPORTANT UI PRINCIPLE

Do not expose raw database concepts unnecessarily.

Users should see:

"Stock In"

instead of:

"INSERT inventory_record"

Users should see:

"Low Stock"

instead of:

"quantity <= reorderLevel"

The interface should represent business operations.

---

# 51. COMPONENT LIBRARY

Create reusable components:

Buttons

Primary Button

Secondary Button

Danger Button

Icon Button

Inputs

Text Input

Number Input

Search Input

Select

Date Picker

Checkbox

Badges

In Stock

Low Stock

Out of Stock

Active

Inactive

Admin

Staff

Tables

Pagination

Dropdown

Modal

Confirmation Modal

Toast

Cards

KPI Card

Status Card

Chart Card

Sidebar

Header

Breadcrumb

Tabs

Skeleton loaders

Empty states

Error states

---

# 52. INTERACTION DESIGN

Create prototype connections for the main flows.

FLOW A — LOGIN

Login

→ Dashboard

FLOW B — PRODUCT CREATION

Products

→ Add Product

→ Fill Form

→ Create Product

→ Success Toast

→ Products

FLOW C — PRODUCT DETAILS

Products

→ View Product

→ Product Details

FLOW D — EDIT

Product Details

→ Edit

→ Edit Product

→ Save

→ Product Details

FLOW E — STOCK IN

Inventory

→ Stock In

→ Select Product

→ Enter Quantity

→ Confirm

→ Success

→ Updated Inventory

FLOW F — STOCK OUT

Inventory

→ Stock Out

→ Select Product

→ Enter Quantity

→ Validate

→ Confirm

→ Updated Inventory

FLOW G — REPORTING

Reports

→ Inventory Report

→ Apply Filters

→ Updated Report

FLOW H — ADMIN USER MANAGEMENT

Admin

→ Users

→ Add User

→ Create User

→ Users

FLOW I — LOGOUT

Any authenticated page

→ Logout

→ Login

---

# 53. PROTOTYPE CONNECTION RULES

Use realistic interactions.

Buttons should navigate to actual screens.

Modal buttons should open/close modals.

Tabs should switch content.

Filters should demonstrate their intended behavior.

Tables should link to details.

Sidebar navigation should work.

Dropdowns should open.

Confirmation dialogs should require confirmation.

Do not create decorative prototype connections that don't represent actual application behavior.

---

# 54. MOBILE/RESPONSIVE BEHAVIOR

On smaller screens:

Desktop sidebar becomes a compact navigation.

Tables:

Allow horizontal scrolling where necessary.

Forms:

Single column.

Dashboard cards:

Stack vertically.

Header:

Collapse secondary elements.

Maintain touch-friendly controls.

Minimum interactive target approximately 44px.

---

# 55. ACCESSIBILITY

Design with accessibility in mind.

Requirements:

High text/background contrast

Clear focus states

Keyboard-friendly controls

Visible validation errors

Do not rely solely on color to communicate status.

For example:

Low Stock

should include both:

Amber badge

and text "Low Stock"

---

# 56. DESIGN SYSTEM

Create a dedicated Figma page:

"Design System"

Include:

Colors

Typography

Spacing

Grid

Buttons

Inputs

Forms

Tables

Cards

Badges

Modals

Toasts

Navigation

Icons

States

---

# 57. FIGMA FILE STRUCTURE

Organize the Figma file into these pages:

01 — Cover

02 — Design System

03 — Authentication

04 — Admin Dashboard

05 — Staff Dashboard

06 — Products

07 — Categories

08 — Suppliers

09 — Inventory

10 — Stock Transactions

11 — Reports

12 — User Management

13 — Settings

14 — Components

15 — Prototype Flows

---

# 58. SAMPLE DATA

Use realistic sample data.

Products:

Wireless Mouse
Mechanical Keyboard
USB-C Cable
Laptop Stand
Webcam
HDMI Cable
Office Headset
Bluetooth Speaker

Categories:

Computer Accessories
Cables
Office Equipment
Audio

Suppliers:

TechSource Ltd
Global Electronics
OfficePro Supplies

Users:

Ahmad Khan — Admin

Ali Raza — Staff

Sara Ahmed — Staff

Do not use lorem ipsum.

Use realistic business information.

---

# 59. FINAL DESIGN QUALITY

The final result must look like a real internal business application that could be deployed to a company.

Prioritize:

1. Clear workflows
2. Data visibility
3. Operational efficiency
4. Error prevention
5. Role-based access
6. Consistency
7. Accessibility
8. Responsive behavior
9. Professional visual hierarchy

Do not prioritize visual complexity over usability.

The final prototype should allow someone unfamiliar with the application to understand:

* How to log in
* How to add a product
* How to update inventory
* How stock transactions work
* How to identify low-stock products
* How to view reports
* How Admin and Staff permissions differ

The Figma prototype should function as a visual product specification for subsequent implementation using:

Next.js
TypeScript
PostgreSQL
Prisma

Every major screen, interaction, business rule, loading state, error state, empty state, and role-specific behavior should be represented in the design.
