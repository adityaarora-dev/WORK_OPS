# HR Management System — Stage 1: Foundation & Full-Stack Integration

A modular, scalable, enterprise-ready Human Resources Management System built on the **MERN** stack (MongoDB, Express, React, Node.js).

This repository contains **Stage 1 — Foundation & Full-Stack Integration**, establishing the architectural baseline, directory layout, environment configuration, and end-to-end communication across all tiers of the application.

---

## 1. Project Purpose & Scope

The purpose of **Stage 1** is to create a clean, maintainable, and scalable architectural workspace with a verified communication bridge between:

$$\text{React (Vite)} \longrightarrow \text{Axios API Client} \longrightarrow \text{Express + Node.js} \longrightarrow \text{Mongoose} \longrightarrow \text{MongoDB Atlas}$$

> **Note**: Higher-level HR business modules (Authentication, Employee Management, Payroll, Attendance, Leaves, Performance, etc.) are intentionally deferred to subsequent development stages. Stage 1 focuses strictly on foundational integrity and health monitoring.

---

## 2. Technology Stack

### Frontend (`client/`)
- **React 19**: Declarative user interface library.
- **Vite 8**: Modern build tool and ultra-fast development server with HMR.
- **JavaScript (ES Modules)**: Modern, clean ECMAScript syntax.
- **React Router DOM 7**: Client-side routing and layout management.
- **Axios**: Centralized HTTP client configured with interceptors and environment-driven base URLs.

### Backend (`server/`)
- **Node.js**: Asynchronous event-driven JavaScript runtime (v18+ recommended, v24+ verified).
- **Express 5**: Fast, minimalist web framework for Node.js.
- **Mongoose 9**: Object Data Modeling (ODM) library for MongoDB and Node.js.
- **CORS**: Cross-Origin Resource Sharing middleware configured for environment-defined origins.
- **dotenv**: Environment variable loader.
- **nodemon**: Development tool for automatic server reloads upon file changes.

### Root Orchestration
- **concurrently**: Concurrently executes backend and frontend development servers from a single root command.

---

## 3. Directory Structure

```
HR-Management-System/
│
├── client/                                 # Frontend React application
│   ├── public/                             # Static assets
│   ├── src/
│   │   ├── assets/                         # SVG/Image assets
│   │   ├── components/                     # Reusable UI components
│   │   │   ├── Header.jsx                  # Application branding header
│   │   │   └── StatusBadge.jsx             # Status indicator badge component
│   │   ├── context/                        # React context providers (Stage 2+)
│   │   ├── hooks/                          # Custom React hooks
│   │   │   └── useHealth.js                # Live API & Database health check hook
│   │   ├── layouts/                        # Page layouts
│   │   │   └── RootLayout.jsx              # Main application shell layout
│   │   ├── pages/                          # Application view pages
│   │   │   └── HomePage.jsx                # System integration status page
│   │   ├── services/                       # Centralized API clients
│   │   │   ├── api.js                      # Axios instance with interceptors
│   │   │   └── healthService.js            # Health check API service
│   │   ├── utils/                          # Frontend utility helpers
│   │   ├── App.css                         # App-level styling
│   │   ├── App.jsx                         # React Router configuration
│   │   ├── index.css                       # Global modern stylesheet
│   │   └── main.jsx                        # React 19 application entrypoint
│   ├── .env.example                        # Client environment template
│   ├── .env                                # Local client environment (git-ignored)
│   ├── index.html                          # HTML entrypoint
│   ├── package.json                        # Client dependencies & scripts
│   └── vite.config.js                      # Vite build configuration (Port 5173)
│
├── server/                                 # Backend Express application
│   ├── src/
│   │   ├── config/                         # Database and system configuration
│   │   │   └── db.js                       # Mongoose connection & lifecycle handlers
│   │   ├── controllers/                    # Express request/response controllers
│   │   │   └── health.controller.js        # Health check endpoint controller
│   │   ├── middlewares/                    # Custom Express middlewares
│   │   │   └── errorHandler.js             # 404 handler & centralized error handler
│   │   ├── models/                         # Mongoose data models (Stage 2+)
│   │   ├── routes/                         # API route declarations
│   │   │   ├── health.routes.js            # /api/health route definitions
│   │   │   └── index.js                    # Central API router (/api/...)
│   │   ├── services/                       # Business & integration services
│   │   │   └── health.service.js           # Live database connection inspector
│   │   ├── utils/                          # Server helper utilities
│   │   └── validators/                     # Request payload validators (Stage 2+)
│   ├── .env.example                        # Server environment template
│   ├── .env                                # Local server environment (git-ignored)
│   ├── app.js                              # Express app configuration & middleware
│   ├── package.json                        # Server dependencies & scripts
│   └── server.js                           # Server entrypoint & DB connection boot
│
├── .gitignore                              # Git exclusion rules
├── package.json                            # Root scripts for full-stack workflows
└── README.md                               # System documentation & developer guide
```

---

## 4. Prerequisites

Ensure you have the following installed on your local development machine:

1. **Node.js**: v18.0.0 or later (v24.x LTS tested and verified). Check with:
   ```bash
   node -v
   ```
2. **NPM**: v9.0.0 or later (v11.x tested and verified). Check with:
   ```bash
   npm -v
   ```
3. **MongoDB Atlas Account**: A free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## 5. MongoDB Atlas Setup Guide

To connect the application to MongoDB Atlas:

### Step 1: Create a Cluster
1. Sign in to your [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Create a free shared cluster (e.g., `M0 Sandbox`).

### Step 2: Configure Database User Credentials
1. In the left navigation, navigate to **Security** $\rightarrow$ **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password Authentication**.
4. Create a username (e.g., `hr_admin`) and a secure password.
5. Under **Database User Privileges**, select **Read and write to any database** (or assign specific database privileges).
6. Click **Add User**.

### Step 3: Configure Network Access (IP Whitelist)
1. In the left navigation, navigate to **Security** $\rightarrow$ **Network Access**.
2. Click **Add IP Address**.
3. Select **Add Current IP Address** (or select `Allow Access From Anywhere` (`0.0.0.0/0`) for development).
4. Confirm and allow Atlas 1-2 minutes to apply changes.

### Step 4: Retrieve Connection String
1. Navigate to **Deployment** $\rightarrow$ **Database**.
2. Click **Connect** on your cluster.
3. Select **Drivers** (Node.js).
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hr_db?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials.

---

## 6. Environment Configuration

### Backend Environment (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
# In server/ directory
cp .env.example .env
```

Edit `server/.env` with your settings:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hr_db?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port where Express server listens | `5000` |
| `MONGODB_URI` | MongoDB Atlas SRV connection string | Required for DB |
| `CLIENT_URL` | Allowed origin for CORS validation | `http://localhost:5173` |

> 🔒 **Security Notice**: Never commit `server/.env` or hardcode credentials into source files. The `.gitignore` file automatically excludes all `.env` files.

### Frontend Environment (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```bash
# In client/ directory
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL prefix for backend communication | `http://localhost:5000/api` |

---

## 7. Installation & Setup

You can install dependencies for the root, server, and client all at once from the root directory:

```bash
# From HR-Management-System/ root
npm run install:all
```

Or install them individually:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

---

## 8. Starting the Application

### Option A: Run Both Services Simultaneously (Recommended)

From the project root:

```bash
npm run dev
```

This concurrently starts:
- **Express Backend**: Listening on [http://localhost:5000](http://localhost:5000) (via nodemon)
- **Vite Frontend**: Serving on [http://localhost:5173](http://localhost:5173) (with HMR)

### Option B: Run Services Separately

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

---

## 9. API Health Check Endpoint

### Endpoint: `GET /api/health`

The health check endpoint provides a structured, live inspection of the API server and the underlying MongoDB connection state.

#### Response Structure

**When Connected to MongoDB Atlas (`200 OK`):**
```json
{
  "success": true,
  "message": "HR Management API is running",
  "database": "connected",
  "timestamp": "2026-09-01T17:20:09.575Z",
  "uptime": "42s",
  "environment": "development"
}
```

**When MongoDB is Disconnected / Unconfigured (`200 OK` / Degraded Mode):**
```json
{
  "success": false,
  "message": "HR Management API is running (Database disconnected)",
  "database": "disconnected",
  "timestamp": "2026-09-01T17:20:09.575Z",
  "uptime": "12s",
  "environment": "development"
}
```

#### Manual Verification via cURL / PowerShell:
```bash
# cURL
curl http://localhost:5000/api/health

# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" | ConvertTo-Json
```

---

## 10. Architectural Data Flow

```
[ User Browser ]
       │
       ▼
[ React Application (:5173) ]
       │ (Calls useHealth hook on mount / refresh)
       ▼
[ Centralized Axios Client (services/api.js) ]
       │ (Sends GET request to VITE_API_URL/health)
       ▼
[ Express Server (:5000) (app.js) ]
       │ (CORS validation against CLIENT_URL)
       │ (express.json() parser)
       ▼
[ Health Route (routes/health.routes.js) ]
       │
       ▼
[ Health Controller (controllers/health.controller.js) ]
       │
       ▼
[ Health Service (services/health.service.js) ]
       │
       ▼
[ Mongoose Database Module (config/db.js) ]
       │ (Inspects mongoose.connection.readyState)
       ▼
[ MongoDB Atlas Cluster ]
       │
       ▲ (Returns connection status)
       │
[ Formatted JSON Response ]
       │
       ▼
[ React UI Updates Badges & Metadata ]
```

---

## 11. Common Development Errors & Troubleshooting

### Issue 1: `CORS error: Origin http://localhost:5173 not allowed by CORS policy`
- **Cause**: `CLIENT_URL` in `server/.env` is either missing, misconfigured, or contains trailing slashes.
- **Solution**: Check `server/.env` and ensure `CLIENT_URL=http://localhost:5173`. Restart the server.

### Issue 2: `[Database] Connection Error: MONGODB_URI is not configured`
- **Cause**: `MONGODB_URI` in `server/.env` is empty or still contains placeholder values.
- **Solution**: Add your valid MongoDB Atlas SRV URI to `server/.env` and save. Nodemon will automatically reload.

### Issue 3: `MongoServerSelectionError: connection timed out / IP not whitelisted`
- **Cause**: Your current client IP address is not in MongoDB Atlas Network Access whitelist.
- **Solution**: In Atlas, navigate to **Network Access** $\rightarrow$ **Add IP Address** $\rightarrow$ select **Add Current IP Address** or `0.0.0.0/0` for development.

### Issue 4: `MongoServerError: bad auth: Authentication failed`
- **Cause**: Invalid database username or password in `MONGODB_URI`. Special characters in passwords must be URL-encoded (e.g., `@` as `%40`).
- **Solution**: Verify credentials in **Database Access** in Atlas. Update `server/.env`.

### Issue 5: `Error: listen EADDRINUSE: address already in use :::5000`
- **Cause**: Another process is already running on port 5000.
- **Solution**: Terminate the existing process or change `PORT=5001` in `server/.env` and update `VITE_API_URL=http://localhost:5001/api` in `client/.env`.

---

## 12. Verification & Build Commands

- **Build Frontend**:
  ```bash
  npm run build:client
  ```
- **Lint Frontend**:
  ```bash
  npm --prefix client run lint
  ```
- **Run Backend in Development**:
  ```bash
  npm run dev:server
  ```
- **Run Frontend in Development**:
  ```bash
  npm run dev:client
  ```
- **Run Full-Stack Concurrently**:
  ```bash
  npm run dev
  ```

---

# STAGE 2: AUTHENTICATION & AUTHORIZATION

Stage 2 delivers a robust, secure, and scalable Role-Based Access Control (RBAC) and JWT authentication system across the entire MERN stack.

---

## 1. Authentication & Authorization Architecture

### A. Authentication ("Who is the user?")
- **Algorithm**: HMAC-SHA256 (`HS256`) JSON Web Tokens via `jsonwebtoken`.
- **Payload**: Minimal safe identity info only (`{ id: user._id, role: user.role }`). Sensitive data, passwords, and password hashes are strictly excluded from the token.
- **Header**: Standard HTTP `Authorization: Bearer <token>`.
- **Password Security**: Salted bcrypt hashing via `bcryptjs` (salt work factor: 10). Passwords are only hashed if newly created or modified, preventing double-hashing. Password fields are marked with `select: false` and explicitly sanitized via Mongoose `toJSON` transforms.

### B. Authorization ("What is the user allowed to do?")
- **Backend as Source of Truth**: Authorization middleware (`authorizeRoles('admin', 'hr', ...)`) enforces role permissions at the route handler level before any controller or service executes.
- **Frontend Route Protection**: `<ProtectedRoute allowedRoles={[...]}>` component guards client-side routes, gracefully redirecting unauthenticated traffic to `/login` and rendering a clean `403 Forbidden` card for unauthorized roles.

---

## 2. Supported Roles & Permission Matrix

The system implements four distinct hierarchical roles:

| Role | Access Level | Permitted Operations |
| :--- | :--- | :--- |
| **ADMIN** | Full System Access | User management, employee management, department management, attendance, leave, payroll, performance, system administration, and reports. |
| **HR** | Human Resources Operations | Employee onboarding & profile management, attendance monitoring, leave administration, HR analytics, and operational reports. |
| **MANAGER** | Team Leadership | View assigned team employees, track team attendance, review/approve/reject team leave requests, team performance reports. |
| **EMPLOYEE** | Self-Service | View personal profile, submit & view personal leave requests, log & view personal attendance. Cannot access administrative tools. |

---

## 3. Safe HR-User Handling & Initial Admin Creation

### Non-Destructive Data Preservation
When `npm run seed` executes:
1. Connects to MongoDB Atlas and inspects the database.
2. If an existing HR user is detected:
   - Preserves all existing fields and custom attributes.
   - Inspects whether the password is a valid bcrypt hash (`$2a$` / `$2b$`).
   - If not hashed, migrates the password using `HR_PASSWORD` or fallback `HrAdmin@1810#` without deleting or altering any existing user metadata.
   - Never creates duplicate HR users.
3. If no HR user exists, seeds initial HR user (`hr@hrms.local`).
4. Seeds the primary system administrator (`admin@hrms.local`, `ADM001`) with bcrypt hashing.
5. Seeds demo manager (`manager@hrms.local`) and employee (`employee@hrms.local`) accounts for end-to-end testing.

### Command:
```bash
# From project root
npm run seed

# Or inside server/
npm --prefix server run seed
```

---

## 4. API Endpoints Reference

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT + safe user object. |
| `GET` | `/api/auth/me` | Protected | Returns the authenticated user profile from token. |
| `POST` | `/api/auth/logout` | Protected/Public | Confirms session termination and token invalidation. |
| `POST` | `/api/auth/register` | Public | Self-registration strictly restricted to `employee` role. |

### Role Authorization Verification Endpoints (`/api/test`)
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/test/admin` | `admin` | Verifies top-tier administrator clearance. |
| `GET` | `/api/test/hr` | `admin`, `hr` | Verifies HR operational clearance. |
| `GET` | `/api/test/manager` | `admin`, `hr`, `manager` | Verifies departmental managerial clearance. |
| `GET` | `/api/test/employee` | All Authenticated | Verifies baseline employee clearance. |

---

## 5. Automated Verification Test Suites

Run the comprehensive 26-assertion automated test suite:
```bash
# Run backend test suite
node server/src/scripts/test_auth_suite.js

# Run expired token and inactive account edge-case tests
node server/src/scripts/test_edge_cases.js
```

---

## 6. Pre-Configured Test Credentials

| Role | Email | Password | Allowed Test Endpoints |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@hrms.local` | `Admin@123456` | Admin, HR, Manager, Employee |
| 💼 **HR** | `hr@hrms.local` | `HrAdmin@1810#` | HR, Manager, Employee (Admin denied: 403) |
| 👔 **Manager** | `manager@hrms.local` | `Manager@123456` | Manager, Employee (Admin & HR denied: 403) |
| 👤 **Employee** | `employee@hrms.local` | `Employee@123456` | Employee only (Admin, HR, Manager denied: 403) |

---

# STAGE 2.5: ROLE-BASED UI, DASHBOARDS & NAVIGATION

Stage 2.5 establishes the complete frontend role-driven UI architecture, global authenticated layout, dynamic sidebar navigation, and dedicated role dashboards.

---

## 1. Global Application Shell (`DashboardLayout`)
- **Desktop Sidebar**: Sticky left navigation dynamically generated based on authenticated `user.role` via `navConfig.js`. Includes employee profile indicator and direct logout action.
- **Responsive Topbar**: Provides mobile hamburger drawer toggle, active application context, and quick link to Stage 1 System Health.
- **Mobile Drawer**: Responsive backdrop overlay and collapsible navigation for tablet/mobile viewports (`<= 1024px`).
- **Route Protection**: Reusable `<ProtectedRoute>` guards all dashboard routes. Unauthenticated visitors are automatically redirected to `/login`, while unauthorized roles are greeted with the `<ForbiddenPage>` (403 Access Forbidden).

---

## 2. Role-Based Navigation Matrix

| Role | Permitted Sidebar Navigation Menu |
| :--- | :--- |
| **👑 ADMIN** | Dashboard, User Management, Employee Management, Departments, Attendance, Leave Management, Payroll, Performance, Recruitment, Reports, System Administration, Settings, Profile |
| **💼 HR** | Dashboard, Employee Management, Departments, Attendance, Leave Management, HR Analytics, Reports, Profile, Settings |
| **👔 MANAGER** | Dashboard, My Team, Team Attendance, Team Leave, Team Performance, Team Reports, Profile |
| **👤 EMPLOYEE** | Dashboard, My Profile, My Attendance, My Leave, My Payroll, My Documents, My Performance, Settings |

---

## 3. Dedicated Role Dashboards (`/dashboard`)

The system dynamically renders the role-tailored dashboard at `/dashboard`:
1. **Admin Dashboard**: Executive workforce stats (Total Employees, Total Users, Departments, Present Today, On Leave, Pending Requests), recent employee additions, security protocol checklist, quick action shortcuts.
2. **HR Dashboard**: Operational workforce stats, attendance overview, pending leave approval queue, action items checklist.
3. **Manager Dashboard**: Departmental team roster, present team count, team leave reviews (Approve/Decline), team performance quick links.
4. **Employee Dashboard**: Welcome card with personal identity summary, today's attendance check-in record, remaining leave balances (Annual, Sick, Casual), and self-service quick action tiles.

---

# STAGE 3: EMPLOYEE MANAGEMENT MODULE

Stage 3 provides an end-to-end, production-grade Employee Management module across the full MERN stack.

---

## 1. Employee Data Model & Schema
- **Collection**: `employees` (MongoDB Atlas `hr_db`)
- **Key Fields**:
  - `employeeId`: Unique uppercase identifier (auto-generated sequentially: `EMP001`, `EMP002`, ...).
  - `firstName`, `lastName`, `email` (indexed, unique, lowercase).
  - `phone`, `alternatePhone`, `address` (`street`, `city`, `state`, `postalCode`, `country`).
  - `department` (indexed), `designation`, `employmentType` (`full-time`, `part-time`, `contract`, `intern`).
  - `employmentStatus` (indexed: `active`, `inactive`, `on-leave`, `terminated`).
  - `manager` (ObjectId reference to `Employee`).
  - `user` (ObjectId reference to `User` for authenticated login linkage).
  - `dateOfBirth`, `gender`, `emergencyContact` (`name`, `phone`, `relationship`).
  - `createdAt`, `updatedAt` (Mongoose timestamps).

---

## 2. Resource-Level Authorization Rules

| Operation | ADMIN | HR | MANAGER | EMPLOYEE |
| :--- | :---: | :---: | :---: | :---: |
| **List Employees** (`GET /api/employees`) | All | All | Assigned Team & Self | Self Only |
| **View Profile** (`GET /api/employees/:id`) | Any | Any | Team & Self Only | Self Only |
| **Create Employee** (`POST /api/employees`) | Allowed | Allowed | 403 Forbidden | 403 Forbidden |
| **Update Employee** (`PATCH /api/employees/:id`) | Allowed | Allowed | 403 Forbidden | 403 Forbidden |
| **Deactivate** (`DELETE /api/employees/:id`) | Soft Delete | Soft Delete | 403 Forbidden | 403 Forbidden |

---

## 3. API Endpoints Reference (`/api/employees`)

| Method | Route | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Paginated, filtered list | `page`, `limit`, `search`, `department`, `employmentStatus` |
| `GET` | `/api/employees/:id` | Single employee profile | Supports MongoDB ObjectId or `EMPxxx` |
| `POST` | `/api/employees` | Onboard new employee | Body: `firstName`, `lastName`, `email`, `department`, `designation`, etc. |
| `PATCH` | `/api/employees/:id` | Update employee record | Body: fields to modify |
| `DELETE` | `/api/employees/:id` | Soft-deactivate employee | Sets `employmentStatus: 'inactive'` |
| `GET` | `/api/employees/meta/departments` | Distinct department list | None |

---

## 4. Frontend Employee Management Pages
- **`/employees`**: Employee directory table with search, department filter, status filter, pagination, and role-based actions (View, Edit, Deactivate).
- **`/employees/new`**: Multi-section onboarding form (Personal, Contact, Employment, Emergency).
- **`/employees/:id`**: Comprehensive profile page with tabbed views (Personal, Employment & Manager, Contact & Emergency, Future Module Placeholders).
- **`/employees/:id/edit`**: Form for updating designation, status, supervisor, address, and contact details.

---

## 5. Automated Test Suite Execution

Run the complete 46-test automated verification suite:
```bash
# Auth and RBAC suite
node server/src/scripts/test_auth_suite.js

# Expired token and inactive user edge cases
node server/src/scripts/test_edge_cases.js

# Full Employee CRUD and Resource Authorization suite
node server/src/scripts/test_employee_suite.js
```
