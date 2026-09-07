# StockFlow — Technology Stack & Engineering Guide

> **Document Purpose:** Complete plain-English reference guide explaining every language, framework, database, tool, and DevOps technology used in StockFlow — what it does, why we chose it, and how to explain it in an interview.

---

## 📌 Quick Summary Table

| Category | Technology | Version | Plain-English Description & Purpose |
| :--- | :--- | :--- | :--- |
| **Language** | **TypeScript** | 5.7 | JavaScript with strict types; catches bugs before code ever runs. |
| **Runtime** | **Node.js** | 20+ | Runs JavaScript on the server backend outside the browser. |
| **Frontend UI** | **React** | 19.0 | Component-based library for building dynamic, reactive user interfaces. |
| **Build Tool** | **Vite** | 8.0 | Ultra-fast development server and bundle compiler for the frontend. |
| **Styling** | **Tailwind CSS** | v4 | Utility-first CSS framework for rapid, modern design without writing custom CSS files. |
| **Icons** | **Lucide React** | 1.37 | Lightweight, clean vector SVG icons for UI buttons and navigation. |
| **Routing** | **React Router** | v7 | Manages client-side page navigation (URLs) without refreshing the browser. |
| **Backend API** | **Express** | 5.2 | Lightweight Node.js web framework that creates REST API endpoints (`/api/...`). |
| **Database** | **PostgreSQL** | 16 | Enterprise-grade relational database storing tables, relations, and ACID transactions. |
| **ORM** | **Prisma** | 6.19 | Object-Relational Mapper; lets us query PostgreSQL with type-safe TypeScript functions. |
| **Security** | **Bcrypt.js** | 3.0 | One-way cryptographic password hashing so passwords are never stored in plain text. |
| **Security** | **Helmet** | 8.3 | Middleware that attaches security headers to HTTP responses (protects against XSS/sniffing). |
| **Testing** | **Vitest** | 4.1 | High-speed automated unit and integration test runner (runs our 55 tests). |
| **API Testing** | **Supertest** | 7.2 | Makes simulated HTTP requests to Express endpoints during automated tests. |
| **Container** | **Docker** | Multi-stage | Packages the entire app, Node runtime, and dependencies into a portable container. |
| **Cloud Host** | **Render** | Cloud PaaS | Hosts our live web app and provides the managed PostgreSQL database. |
| **CI / CD** | **GitHub Actions** | Workflows | Automates testing, typechecking, and build validation on every GitHub commit. |

---

## 1. Programming Languages

### 🔷 TypeScript
* **What is it?**  
  TypeScript is JavaScript with static typing created by Microsoft. While normal JavaScript allows any variable to change into anything (which causes silent runtime crashes like `undefined is not a function`), TypeScript forces you to define what each piece of data looks like.
* **What it does in StockFlow:**  
  Every file ending in `.ts` or `.tsx` is TypeScript. We define explicit interfaces for `Product`, `User`, `Category`, `StockTransaction`, etc. If a function expects a number and someone passes a string, the compiler rejects it immediately.
* **How to explain it in an interview:**  
  *"We use TypeScript across both the frontend and backend to enforce strict data contracts. It prevents type errors at compile time and makes refactoring much safer."*

### 🔷 SQL (Structured Query Language)
* **What is it?**  
  The universal declarative language used to create, read, update, and query relational databases.
* **What it does in StockFlow:**  
  While Prisma writes most queries for us, our underlying database runs SQL queries with relational foreign keys (`REFERENCES`), unique constraints (`UNIQUE INDEX`), and transaction locks (`BEGIN...COMMIT`).
* **How to explain it in an interview:**  
  *"SQL manages our relational data integrity. It guarantees that inventory movements, stock deductions, and audit logs obey relational foreign key constraints."*

---

## 2. Frontend Layer

### ⚛️ React (v19)
* **What is it?**  
  The world's most popular frontend UI library developed by Meta. Instead of manually editing HTML elements with `document.getElementById()`, React lets you break your UI into reusable, state-driven components.
* **What it does in StockFlow:**  
  All 15 screens (`Dashboard.tsx`, `Products.tsx`, `StockIn.tsx`, `StockOut.tsx`, etc.) and UI elements (`Modal.tsx`, `Header.tsx`, `Sidebar.tsx`) are React components. When inventory or user session state updates, React re-renders only the changed parts of the screen.
* **How to explain it in an interview:**  
  *"React powers our Single Page Application (SPA). It manages component state, re-renders the UI reactively when stock changes, and separates UI concerns into reusable primitives."*

### ⚡ Vite (v8)
* **What is it?**  
  A modern, ultra-fast frontend build tool created by Evan You (creator of Vue). Older tools like Webpack took 30–60 seconds to bundle an app. Vite uses native browser ES Modules (ESM) to start instantaneously (< 300ms) and hot-reloads edits instantly.
* **What it does in StockFlow:**  
  Vite compiles our React and TypeScript code into clean HTML/JS/CSS bundles in the `dist/` folder, and proxies frontend `/api` requests to port 3001 during local development.
* **How to explain it in an interview:**  
  *"Vite is our development server and production bundler. It provides near-instant Hot Module Replacement during development and compiles an optimized production bundle for Docker."*

### 🎨 Tailwind CSS (v4)
* **What is it?**  
  A utility-first CSS framework. Instead of writing separate `.css` files with custom class names, you apply small, pre-defined utility classes directly to HTML elements (e.g. `flex items-center bg-blue-600 p-4 rounded-lg text-white`).
* **What it does in StockFlow:**  
  Styles every button, card, modal, and table. In Tailwind v4, theme tokens (colors, font sizes, border radius) are configured directly in `src/index.css` using modern CSS `@theme` variables.
* **How to explain it in an interview:**  
  *"Tailwind CSS gives us complete design control without stylesheet bloat. It keeps our styling consistent and responsive across mobile, tablet, and desktop screens."*

### 🧭 React Router (v7)
* **What is it?**  
  A client-side routing library for React. In traditional websites, clicking a link asks the server for a whole new HTML page. In a React SPA, React Router intercepts the browser URL and swaps the visible screen component instantly without a full page reload.
* **What it does in StockFlow:**  
  Maps paths like `/dashboard`, `/products`, `/products/edit/:id`, `/stock-in`, and `/users` to their respective page components.
* **How to explain it in an interview:**  
  *"React Router provides declarative client-side navigation. It allows users to bookmark URLs, use the browser's back/forward buttons, and transition between screens seamlessly."*

---

## 3. Backend & API Layer

### 🟢 Node.js (v20+)
* **What is it?**  
  A JavaScript runtime environment that lets developers execute JavaScript on server machines outside of a web browser, built on Google Chrome's V8 engine.
* **What it does in StockFlow:**  
  Runs our backend server process, connects to PostgreSQL, handles HTTP requests, executes business logic, and schedules background jobs.
* **How to explain it in an interview:**  
  *"Node.js runs our backend API using non-blocking, asynchronous I/O, which makes it fast and lightweight for handling concurrent HTTP requests."*

### 🚀 Express (v5)
* **What is it?**  
  The most widely used backend web framework for Node.js. It gives you a clean system to define HTTP routes (`GET`, `POST`, `PUT`, `DELETE`), parse JSON request bodies, and plug in middleware functions.
* **What it does in StockFlow:**  
  Houses our REST API endpoints (`/api/auth/*`, `/api/products/*`, `/api/inventory/*`, `/api/users/*`). It validates sessions, extracts user roles, calls service functions, and returns standardized JSON responses:
  ```json
  { "success": true, "data": { ... } }
  ```
* **How to explain it in an interview:**  
  *"Express 5 provides our REST API routing and middleware pipeline. It handles authentication checks, error handling, and JSON serialization."*

### 🛡️ Helmet & CORS
* **What is Helmet?**  
  A security middleware that automatically sets HTTP response headers (like `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`) to prevent clickjacking, cross-site scripting (XSS), and MIME sniffing.
* **What is CORS?**  
  Cross-Origin Resource Sharing. Browsers block websites from making API requests to a different domain by default. CORS middleware explicitly authorizes trusted origins (e.g. `http://localhost:5173` or your Render domain) to call the API with credentials/cookies.
* **How to explain it in an interview:**  
  *"Helmet secures our HTTP response headers, while CORS ensures only our frontend application can make credentialed requests to the API."*

---

## 4. Database & Persistence Layer

### 🐘 PostgreSQL (v16)
* **What is it?**  
  An enterprise-grade, open-source object-relational database management system (RDBMS) known for its reliability, data integrity, and ACID transaction support.
* **What it does in StockFlow:**  
  Stores all permanent data across 7 tables: `users`, `sessions`, `categories`, `suppliers`, `products`, `stock_transactions`, and `audit_logs`.
* **Why did we choose PostgreSQL over MongoDB or basic SQLite?**  
  Inventory is relational by nature. A product belongs to a category and a supplier; a stock transaction references a product and a user. PostgreSQL guarantees **ACID transactions**: if a stock-out fails halfway through, nothing is saved, preventing corrupt or negative stock.
* **How to explain it in an interview:**  
  *"We chose PostgreSQL because inventory systems require relational integrity and ACID transactions. It guarantees that inventory counts, transactions, and audit logs are permanently persisted with row-level integrity."*

### 💎 Prisma ORM (v6)
* **What is it?**  
  An Object-Relational Mapper (ORM). Normally, you have to write raw SQL strings like `SELECT * FROM products WHERE id = '123';` which can have typos or SQL injection vulnerabilities. Prisma reads a schema file (`prisma/schema.prisma`) and automatically generates a 100% type-safe TypeScript query client.
* **What it does in StockFlow:**  
  Allows us to write clean code like:
  ```ts
  const product = await prisma.product.findUnique({ where: { id } });
  await prisma.product.update({ where: { id }, data: { quantity: newStock } });
  ```
  It also runs database transactions: `prisma.$transaction(async (tx) => { ... })`.
* **How to explain it in an interview:**  
  *"Prisma is our database abstraction layer. It provides type-safe queries, eliminates SQL injection vulnerabilities, and coordinates multi-step ACID transactions."*

---

## 5. Security & Authentication

### 🔒 Bcrypt (`bcryptjs`)
* **What is it?**  
  A cryptographic one-way password hashing algorithm with configurable salt rounds. "One-way" means once a password like `Admin@123` is hashed into `$2a$10$e7W...`, it is computationally impossible to reverse back into the plain text password.
* **What it does in StockFlow:**  
  When a user registers or changes passwords, we hash the password before writing to PostgreSQL. When logging in, Bcrypt compares the candidate password against the stored hash. Even if an attacker stole the database, they would never see user passwords.
* **How to explain it in an interview:**  
  *"We never store plain text passwords. Bcrypt hashes passwords with random salt rounds, protecting user credentials against dictionary and rainbow table attacks."*

### 🍪 HTTP-Only Session Cookies
* **What is it?**  
  A cookie marked with the `HttpOnly` and `SameSite=Lax` flags. Normal cookies can be read by JavaScript code (`document.cookie`), making them vulnerable to malicious scripts (XSS). An `HttpOnly` cookie is handled strictly by the browser engine and cannot be accessed by JavaScript.
* **What it does in StockFlow:**  
  After verifying a password, the server generates a 64-character random cryptographic token, saves it in the `sessions` table, and sends it as an `HttpOnly` cookie named `stockflow_session`.
* **How to explain it in an interview:**  
  *"We store session tokens in HttpOnly, SameSite cookies. This protects the session token from being stolen by malicious third-party scripts via Cross-Site Scripting (XSS)."*

---

## 6. DevOps, Docker & Cloud Deployment

### 🐳 Docker & Multi-Stage Dockerfile
* **What is it?**  
  Docker is a containerization platform. Instead of saying *"it works on my machine but breaks on yours"*, Docker packages the application code, Node.js runtime, system libraries, and dependencies into an isolated container that runs identically on Mac, Windows, Linux, or cloud servers.
* **What is our "Multi-Stage" Dockerfile?**  
  A multi-stage Docker build uses two separate environments in the same file:
  - **Stage 1 (Builder):** Installs all heavy build tools, TypeScript compiler, and Vite to build the frontend and generate Prisma client.
  - **Stage 2 (Runner):** Copies *only* the finished compiled code into a lightweight, stripped Alpine Linux container (~150MB instead of 1GB).
* **How to explain it in an interview:**  
  *"We use Docker for environment parity. Our multi-stage Dockerfile compiles the bundle in a build stage and copies only the minimal production artifacts into a stripped Alpine runner, reducing container size and attack surface."*

### ☁️ Render
* **What is it?**  
  A modern Cloud Platform-as-a-Service (PaaS) similar to AWS or Heroku.
* **What it does in StockFlow:**  
  Render pulls our GitHub repository, builds our Docker container, runs our Node/Express web service on port 3001, and provides a managed PostgreSQL 16 database with SSL encryption.
* **How to explain it in an interview:**  
  *"Render hosts our production environment. It runs our Docker container and provides a managed PostgreSQL database with automatic restart recovery and SSL encryption."*

### 🤖 GitHub Actions (CI / CD)
* **What is it?**  
  Continuous Integration & Continuous Deployment (CI/CD) automation built directly into GitHub.
* **What it does in StockFlow:**  
  Every time you push a commit to GitHub, GitHub spins up a fresh virtual machine (Ubuntu), runs a real PostgreSQL container service, installs dependencies, typechecks TypeScript, runs our 55 automated tests, and builds the production bundle. If any test fails, it marks the commit red.
* **How to explain it in an interview:**  
  *"Our GitHub Actions CI pipeline acts as an automated quality gate. It runs typechecks, pushes schema to a PostgreSQL test service, and executes all 55 tests on every pull request before code can be merged."*

---

## 7. Testing Stack

### 🧪 Vitest (v4)
* **What is it?**  
  A blazing-fast next-generation test framework built specifically for Vite. It is a modern replacement for Jest that supports TypeScript and ESM natively.
* **What it does in StockFlow:**  
  Executes all 14 test suites and 55 automated test cases in `tests/` and `src/components/__tests__/`. It tests everything from authentication and role guards to atomic stock-outs and concurrent race conditions.
* **How to explain it in an interview:**  
  *"Vitest is our test runner. We use it to verify backend business invariants, role authorization, and high-concurrency scenarios with over 86% server coverage."*

### 🌐 Supertest
* **What is it?**  
  An HTTP assertion library for Node.js. It lets you send simulated HTTP requests (`.post('/api/auth/login')`, `.get('/api/products')`) directly to an Express app in memory without needing to start a live HTTP port.
* **What it does in StockFlow:**  
  Used across all integration test files to test API endpoints, inspect status codes (`200 OK`, `400 Bad Request`, `403 Forbidden`), verify JSON response payloads, and check cookie headers.
* **How to explain it in an interview:**  
  *"Supertest lets us perform end-to-end integration testing against our Express endpoints, verifying status codes, request cookies, and JSON responses."*

---

## 💡 Quick Interview Cheat Sheet: "Why did you choose X instead of Y?"

| Decision | Why We Chose It | What We Avoided / Trade-off |
| :--- | :--- | :--- |
| **PostgreSQL** vs. SQLite | Real ACID transactions, concurrent row locks, and cloud persistence. | SQLite is great for local prototypes, but locks the whole file during writes and loses data in ephemeral containers. |
| **Prisma** vs. Raw SQL | Type safety, auto-generated TypeScript types, and schema migrations. | Raw SQL is flexible but prone to typos, lacks autocomplete, and requires manual mapping. |
| **React 19 + Vite** vs. Next.js | Clean separation between backend Express API and frontend client; maximum control over API middleware. | Next.js bundles frontend and backend together, which can blur architectural layer boundaries. |
| **HttpOnly Cookies** vs. LocalStorage | Immune to JavaScript XSS token theft. | Storing tokens in `localStorage` makes them readable by any malicious npm package or XSS script. |
| **Multi-Stage Docker** vs. Single Stage | Final container is small (~150MB), fast to deploy, and omits build tools. | Single-stage containers include compilers, node_modules bloat, and have a larger security attack surface. |
