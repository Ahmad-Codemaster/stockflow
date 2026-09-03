# StockFlow — Implementation Build Log

> **Document:** Engineering Build Log & Architecture Summary  
> **Status:** COMPLETED & VERIFIED (55/55 Tests Passing, $\ge 86\%$ Coverage)  
> **Deployment:** Render (Docker + Managed PostgreSQL)  

---

## 1. Executive Summary

StockFlow has transitioned from an in-memory UI prototype into a production-grade, full-stack inventory management system. It features real PostgreSQL database persistence, HTTP-only session authentication, role-based access control (Admin vs. Staff), ACID inventory transactions with concurrency control, interactive SVG dashboards, and comprehensive automated test coverage.

---

## 2. Chronological Milestones

| Milestone | Scope & Deliverables |
| :--- | :--- |
| **1. Routing & Shell** | Integrated `react-router-dom` across 15 views; preserved all Figma design tokens and UI components. |
| **2. Express API & Middleware** | Express 5 REST API with Helmet security headers, CORS with credentials, cookie parsing, and structured JSON responses. |
| **3. Database & Schema** | Prisma ORM with 7 relational models (`users`, `sessions`, `categories`, `suppliers`, `products`, `stock_transactions`, `audit_logs`). |
| **4. Authentication & RBAC** | Bcrypt password hashing, 64-char crypto session tokens in HttpOnly cookies, IP rate limiting, and server-side role route guards. |
| **5. Atomic Inventory Engine** | ACID stock-in/out workflows, `AsyncLock` concurrency mutex, and strict zero-negative-stock invariant. |
| **6. Visual Analytics** | Bespoke responsive SVG charts: KPI trend sparklines, 7-day velocity bar chart, and category valuation donut. |
| **7. User Management & Safety** | Administrative user CRUD, session revocation on deactivation, and Last-Administrator protection. |
| **8. Automated Testing & CI** | 14 test suites (55 automated tests), Vitest dual-environment (Node + JSDOM), GitHub Actions CI workflow. |
| **9. Clean Slate & Deployment** | Purged demo seed data for clean onboarding; containerized with multi-stage Docker; deployed live on Render with PostgreSQL. |

---

## 3. Core Architectural Invariants

- **Persistence:** Render Managed PostgreSQL; zero ephemeral data loss.
- **Transactional Atomicity:** All stock movements run in atomic database transactions (`prisma.$transaction`).
- **Negative Stock Prevention:** Server-enforced invariant (`currentStock - qty >= 0`) returning HTTP 400 on over-deduction.
- **Race Condition Prevention:** Serialized async locking prevents concurrent stock-out discrepancies.
- **Security:** Passwords hashed with Bcrypt, HttpOnly/SameSite session cookies, rate-limited login endpoints.
- **Last-Admin Guard:** System rejects deletion, deactivation, or demotion of the final active administrator.
- **Clean Slate:** Delivered with zero mock/demo items; clean state ready for immediate production onboarding.

---

## 4. Test & Verification Summary

```
Test Suites: 14 passed (14)
Tests:       55 passed (55)
Coverage:    ≥ 86% across core server services
Status:      All passing in CI and local environments
```

For complete technical specifications, see [`docs/`](./docs/). For AI toolchain and prompt methodology disclosures, see [`AI_USAGE.md`](./AI_USAGE.md).
