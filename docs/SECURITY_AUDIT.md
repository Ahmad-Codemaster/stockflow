# StockFlow — Security Review & Vulnerability Assessment

> **Document Version:** 1.0.0  
> **Status:** FORENSIC SECURITY AUDIT  
> **Target System:** StockFlow Inventory Management System  

---

## 1. Executive Summary

A forensic security audit was performed across all source files, configuration files, and state management mechanisms in the repository.

Because this codebase is currently a Figma-exported prototype, **critical security controls are absent**. While the visual layer simulates access control and validation, **there is zero server-side authentication, authorization, token signing, or database concurrency protection.**

---

## 2. Vulnerability Findings & Classification Matrix

| Finding ID | Severity | Category | Vulnerability Description | Remediation Priority |
| :--- | :---: | :--- | :--- | :---: |
| `SEC-001` | **CRITICAL** | Authentication | **Authentication Bypass (Password Ignored):** `login` function checks only email presence; password parameter is completely ignored. Any password grants access. | **P0** |
| `SEC-002` | **CRITICAL** | Authorization | **Client-Side-Only RBAC (UI Hiding):** Role permissions (`ADMIN` vs. `STAFF`) are enforced exclusively in React state. No cryptographic session or backend verification exists. | **P0** |
| `SEC-003` | **CRITICAL** | Data Integrity | **Concurrency Race Conditions:** Stock-Out deductions lack row locking and atomic database updates, permitting simultaneous requests to cause negative inventory. | **P0** |
| `SEC-004` | **HIGH** | Secrets / Data Leak | **User Fixtures Exposed in Client Bundle:** `initialUsers` array in `src/data.ts` embeds user lists, roles, and status directly in the public JavaScript bundle. | **P0** |
| `SEC-005` | **HIGH** | Session Security | **Missing Cryptographic Session Tokens:** No JWT or server session cookie is issued or validated; state is wiped on reload. | **P0** |
| `SEC-006` | **MEDIUM** | Network Security | **Missing Rate Limiting & Brute-Force Protection:** Login form has no throttling mechanism against credential stuffing. | **P1** |
| `SEC-007` | **MEDIUM** | CSRF / CORS | **Unconfigured CORS & Cookie Flags:** Target backend requires strict `SameSite=Lax`, `HttpOnly`, `Secure` cookies and origin whitelisting. | **P1** |
| `SEC-008` | **LOW** | Relational Integrity | **Cascading Relational Orphan Flaw:** In-memory `deleteProduct` completely removes product records, leaving orphaned transaction records. | **P1** |

---

## 3. Deep-Dive Vulnerability Analysis

### 3.1 `SEC-001`: Authentication Bypass (Password Ignored)
* **Location:** `src/context.tsx` (Lines 74–80)
* **Vulnerable Code:**
  ```typescript
  const login = useCallback((email: string, _password: string): 'ok' | 'invalid' | 'inactive' => {
    const user = initialUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return 'invalid';
    if (user.status === 'Inactive') return 'inactive';
    setState(s => ({ ...s, currentUser: user, currentPage: 'dashboard' }));
    return 'ok';
  }, []);
  ```
* **Risk:** Anyone knowing or guessing an employee email address (e.g. `ahmad@stockflow.com`) can log in with full administrative privileges using any random password or empty string.
* **Remediation:** Implement server-side password verification using `argon2.verify(user.password_hash, password)` or `bcrypt.compare`.

---

### 3.2 `SEC-002`: Client-Side-Only RBAC (UI Hiding)
* **Location:** `src/pages/Users.tsx` (Line 79), `src/components/Sidebar.tsx` (Line 75), `src/pages/Products.tsx` (Line 58)
* **Vulnerable Pattern:**
  ```typescript
  if (currentUser?.role !== 'ADMIN') {
    return <AccessDenied />;
  }
  ```
* **Risk:** A malicious or curious user with a `STAFF` account can open the browser console or React Developer Tools, execute `setState(s => ({ ...s, currentUser: { ...s.currentUser, role: 'ADMIN' } }))`, and immediately gain access to the User Management screen, role modification, and product deletion.
* **Remediation:** Server-side route middleware `requireRole(['ADMIN'])` that checks signed JWT / session claims on all modifying API endpoints.

---

### 3.3 `SEC-003`: Concurrency Race Conditions on Stock Deductions
* **Location:** `src/context.tsx` (Lines 213–236)
* **Vulnerable Pattern:**
  ```typescript
  const prevStock = state.inventory.find(i => i.productId === productId)?.currentStock ?? 0;
  if (quantity > prevStock) return false;
  const newStock = prevStock - quantity;
  ```
* **Risk:** If two warehouse staff members simultaneously process a stock-out of 6 units for a product with 10 units in stock, both requests will read `currentStock = 10`, pass the check $6 \le 10$, and execute, resulting in negative stock (-2) or inventory desynchronization.
* **Remediation:** Enforce atomic database updates with row-level pessimistic locking (`SELECT ... FOR UPDATE`) and database check constraints (`CHECK(quantity >= 0)`).

---

### 3.4 `SEC-004`: User Fixtures Exposed in Client Bundle
* **Location:** `src/data.ts` (Lines 3–8)
* **Risk:** Production client bundle contains hardcoded employee names, emails, roles, and status, exposing internal organization structure to public scrutiny.
* **Remediation:** Remove static fixtures from frontend client source; serve all user data exclusively from authenticated backend endpoints with role gating.

---

## 4. Security Verification & Hardening Checklist

- [ ] All password storage uses **Argon2id** or **Bcrypt** with salt rounds $\ge 12$.
- [ ] Session tokens signed using `HS256` or `RS256` with high-entropy 256-bit secrets.
- [ ] Cookies configured with `HttpOnly = true`, `Secure = true`, `SameSite = Lax`.
- [ ] Input DTOs validated using strict **Zod** schemas to block SQL injection and prototype pollution.
- [ ] Rate limiting middleware configured on `/api/v1/auth/login` (max 5 attempts per IP / email per minute).
- [ ] Server headers hardened using `helmet` (Disables `X-Powered-By`, enforces `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- [ ] Database enforces hard constraint `CHECK(quantity >= 0)` at table level.
- [ ] All administrative endpoints (`/api/v1/users/*`, `/api/v1/categories/*`, `/api/v1/suppliers/*`) protected with server-side `requireRole('ADMIN')`.
