# Enterprise HRMS — Project Structure & Architectural Reference

A production-hardened, invite-only Human Resources Management System built on the modern **MERN** stack (**MongoDB Atlas, Express 5, React 19, Node.js v24, Vite 8**).

---

## 1. Project Overview & Architectural Topology

The system is structured as a full-stack monorepo featuring a clean separation of concerns between client-side user interface workflows and server-side business logic, security middleware, and database persistence.

```
                     ┌─────────────────────────────────────────┐
                     │            React 19 + Vite 8            │
                     │          (Single Page Client)           │
                     └────────────────────┬────────────────────┘
                                          │
                                   HTTP / REST / JSON
                              (Axios with JWT Bearer)
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          Express 5 + Node.js v24        │
                     │        (Security, RBAC, Services)       │
                     └────────────────────┬────────────────────┘
                                          │
                                 Mongoose 9 (SSL/TLS)
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │             MongoDB Atlas               │
                     │       (Cloud Distributed Cluster)       │
                     └─────────────────────────────────────────┘
```

---

## 2. Complete Repository Directory Tree

```
HR-Management-System/
├── package.json                        # Root workspace scripts (concurrent full-stack boot)
├── package-lock.json                   # Root package lockfile
├── .gitignore                          # Monorepo git exclusion definitions
├── functioning.md                      # Complete system execution and operational guide
├── README.md                           # Complete project structure and file inventory
│
├── client/                             # Frontend React 19 + Vite 8 Application
│   ├── index.html                      # HTML5 web application entrypoint
│   ├── package.json                    # Client dependencies (Lucide, Axios, Sonner, Router)
│   ├── vite.config.js                  # Vite bundler configuration (Dev port: 5173)
│   ├── src/
│   │   ├── main.jsx                    # React DOM root render tree
│   │   ├── App.jsx                     # Global routing table & Context Provider wrapper
│   │   ├── App.css                     # Minimal application-level overrides
│   │   ├── index.css                   # Master Design System (Navy/Blue palette, 18px radii)
│   │   │
│   │   ├── assets/                     # Static media and branding vectors
│   │   │
│   │   ├── components/                 # Shared UI Components
│   │   │   ├── Header.jsx              # Brand top header for legacy/root routes
│   │   │   ├── ProtectedRoute.jsx      # Client-side RBAC route protection component
│   │   │   ├── StatusBadge.jsx         # Status badge helper
│   │   │   ├── common/                 # Reusable atomic UI elements
│   │   │   │   ├── ActionQueue.jsx     # Dashboard priority task action queue
│   │   │   │   ├── ErrorBoundary.jsx   # Client error boundary crash fallback
│   │   │   │   └── StatCard.jsx        # Standardized KPI metric card with hover lift
│   │   │   ├── layout/                 # Layout structural elements
│   │   │   │   ├── DashboardLayout.jsx # Master authenticated dashboard shell
│   │   │   │   └── Topbar.jsx          # Authenticated topbar with profile & notification bell
│   │   │   └── navigation/             # Navigation controls
│   │   │       ├── Sidebar.jsx         # Collapsible dark navy sidebar with role filters
│   │   │       └── navConfig.js        # Centralized navigation item definitions per role
│   │   │
│   │   ├── context/                    # React Context State Management
│   │   │   ├── AuthContext.jsx         # Global authentication state, tokens, user session
│   │   │   └── NotificationContext.jsx # Live in-app alerts, unread counts, status sync
│   │   │
│   │   ├── hooks/                      # Custom React Hooks
│   │   │   ├── useAuth.js              # Accessor hook for AuthContext
│   │   │   ├── useHealth.js            # Live telemetry polling hook
│   │   │   └── useNotifications.js     # Accessor hook for NotificationContext
│   │   │
│   │   ├── layouts/                    # Outer Structural Layouts
│   │   │   ├── DashboardLayout.jsx     # Authenticated shell layout
│   │   │   └── RootLayout.jsx          # Public page shell
│   │   │
│   │   ├── pages/                      # Application Route Views
│   │   │   ├── HomePage.jsx            # Root system index
│   │   │   ├── LoginPage.jsx           # Unified credentials login
│   │   │   ├── DashboardPage.jsx       # Dynamic dashboard dispatcher based on user role
│   │   │   │
│   │   │   ├── portal/                 # Landing & Authentication Portals
│   │   │   │   ├── RoleSelectionPortal.jsx # Clean Enterprise Gateway role selection
│   │   │   │   └── RoleLoginPage.jsx   # Dedicated role login (Password + Gmail OTP)
│   │   │   │
│   │   │   ├── dashboards/             # Dedicated Role Dashboard Consoles
│   │   │   │   ├── AdminDashboard.jsx  # Executive governance, headcount, departments
│   │   │   │   ├── HrDashboard.jsx     # Workforce stats, leave queue, onboarding shortcuts
│   │   │   │   ├── ManagerDashboard.jsx# Team roster, pending approvals, OKR status
│   │   │   │   └── EmployeeDashboard.jsx # Self-service shift card, PTO balance, paystubs
│   │   │   │
│   │   │   ├── employees/              # Employee Directory & Onboarding
│   │   │   │   ├── EmployeeListPage.jsx    # Filterable employee table with search & badges
│   │   │   │   ├── EmployeeCreatePage.jsx  # HR employee onboarding wizard
│   │   │   │   ├── EmployeeDetailPage.jsx  # Full profile tabbed view
│   │   │   │   └── EmployeeEditPage.jsx    # Employee profile editing form
│   │   │   │
│   │   │   ├── departments/            # Department Management
│   │   │   │   ├── DepartmentListPage.jsx  # Department overview with employee headcounts
│   │   │   │   ├── DepartmentCreatePage.jsx# New department wizard
│   │   │   │   ├── DepartmentDetailPage.jsx# Department roster and manager details
│   │   │   │   └── DepartmentEditPage.jsx  # Department update form
│   │   │   │
│   │   │   ├── attendance/             # Attendance & Time Tracking
│   │   │   │   └── AttendancePage.jsx  # 1-click Clock-In/Out widget & history table
│   │   │   │
│   │   │   ├── leave/                  # Leave Management & Approvals
│   │   │   │   ├── LeaveListPage.jsx   # Leave requests table & approval queue
│   │   │   │   └── LeaveApplyPage.jsx  # Leave application form with date calculations
│   │   │   │
│   │   │   ├── payroll/                # Compensation & Paystubs
│   │   │   │   ├── PayrollListPage.jsx # Payroll processing table & generation modal
│   │   │   │   └── PayrollDetailPage.jsx # Printable digital salary payslip
│   │   │   │
│   │   │   ├── documents/              # Document Management Vault
│   │   │   │   ├── DocumentListPage.jsx# Vault table with authenticated download
│   │   │   │   └── DocumentUploadPage.jsx # Document upload wizard (PDF/MIME checks)
│   │   │   │
│   │   │   ├── performance/            # Performance & OKR Goals
│   │   │   │   ├── ReviewCycleListPage.jsx # Performance cycles management
│   │   │   │   ├── GoalListPage.jsx    # OKR goals with progress sliders
│   │   │   │   ├── PerformanceReviewPage.jsx # Manager review evaluation form
│   │   │   │   └── PerformanceDetailPage.jsx # Acknowledgment & feedback review
│   │   │   │
│   │   │   ├── recruitment/            # Recruitment ATS Pipeline
│   │   │   │   ├── JobOpeningsPage.jsx # Job requisition manager
│   │   │   │   ├── CandidatesPage.jsx  # Candidate talent pool directory
│   │   │   │   ├── ApplicationsPage.jsx# 8-stage visual Kanban pipeline
│   │   │   │   └── ApplicationDetailPage.jsx # Interview notes & candidate conversion
│   │   │   │
│   │   │   ├── reports/                # Operational Analytics & Export
│   │   │   │   └── ReportsPage.jsx     # Analytical charts & RFC 4180 CSV export
│   │   │   │
│   │   │   ├── notifications/          # In-App Notification Center
│   │   │   │   └── NotificationsPage.jsx # Notification inbox & mark-all-read
│   │   │   │
│   │   │   ├── audit/                  # Security Audit Logs
│   │   │   │   └── AuditLogsPage.jsx   # Privilege-scoped audit trail viewer
│   │   │   │
│   │   │   └── common/                 # Common / Utility Views
│   │   │       ├── ProfilePage.jsx     # User personal settings & security
│   │   │       ├── SystemHealthPage.jsx# Live database and API connection monitor
│   │   │       ├── UnauthorizedPage.jsx# 403 Forbidden access denial screen
│   │   │       └── NotFoundPage.jsx    # 404 Route not found screen
│   │   │
│   │   ├── services/                   # Centralized API Service Modules (Axios)
│   │   │   ├── api.js                  # Axios instance with auth interceptors
│   │   │   ├── authService.js          # /api/auth API calls (login, OTP, me)
│   │   │   ├── employeeService.js      # /api/employees API calls
│   │   │   ├── departmentService.js    # /api/departments API calls
│   │   │   ├── attendanceService.js    # /api/attendance API calls
│   │   │   ├── leaveService.js         # /api/leaves API calls
│   │   │   ├── payrollService.js       # /api/payroll API calls
│   │   │   ├── documentService.js      # /api/documents API calls
│   │   │   ├── performanceService.js   # /api/performance API calls
│   │   │   ├── recruitmentService.js   # /api/recruitment API calls
│   │   │   ├── reportService.js        # /api/reports API calls
│   │   │   ├── notificationService.js  # /api/notifications API calls
│   │   │   ├── auditService.js         # /api/audit-logs API calls
│   │   │   └── healthService.js        # /api/health API calls
│   │   │
│   │   └── utils/                      # Client-Side Helper Functions
│   │       ├── currency.js             # INR / USD currency formatting helpers
│   │       ├── dateUtils.js            # Standardized date & timestamp formatters
│   │       └── downloadHelper.js       # Blob stream file download trigger
│   │
│   └── public/                         # Public static web assets
│
└── server/                             # Backend Express 5 + Node.js v24 Application
    ├── package.json                    # Server dependencies (Mongoose, Helmet, JWT)
    ├── server.js                       # Server entrypoint, DNS resolution, DB connect
    ├── app.js                          # Express application initialization & middleware
    │
    ├── src/
    │   ├── config/                     # Configuration Modules
    │   │   ├── db.js                   # Mongoose Atlas connection with auto-reconnect
    │   │   └── email.config.js         # Nodemailer Gmail SMTP transporter
    │   │
    │   ├── middlewares/                # Custom Express Middlewares
    │   │   ├── auth.js                 # JWT verification & authorizeRoles() guards
    │   │   └── errorHandler.js         # 404 handler & centralized error normalizer
    │   │
    │   ├── models/                     # Mongoose Schemas & Models
    │   │   ├── User.js                 # Authentication credentials, hashed passwords
    │   │   ├── Otp.js                  # 6-digit email OTPs with 10-minute TTL index
    │   │   ├── Employee.js             # Comprehensive employee profile details
    │   │   ├── Department.js           # Business units, department heads, codes
    │   │   ├── Attendance.js           # Daily check-in/out & work hours
    │   │   ├── Leave.js                # Leave applications, dates, approval comments
    │   │   ├── Payroll.js              # Monthly salary statements & tax breakdown
    │   │   ├── EmployeeDocument.js     # Secure document metadata & file pointers
    │   │   ├── PerformanceReviewCycle.js # Annual & quarterly review cycles
    │   │   ├── EmployeeGoal.js         # OKR employee goals and progress tracking
    │   │   ├── PerformanceReview.js    # Manager review scores & acknowledgments
    │   │   ├── JobOpening.js           # Recruitment job requisitions
    │   │   ├── Candidate.js            # Candidate talent profiles & resumes
    │   │   ├── JobApplication.js       # Kanban applications linking job & candidate
    │   │   ├── Interview.js            # Scheduled interviews and scorecards
    │   │   ├── Notification.js         # Real-time in-app alerts and read statuses
    │   │   └── AuditLog.js             # Immutable audit trail with redacted secrets
    │   │
    │   ├── controllers/                # Request & Response Controllers
    │   │   ├── auth.controller.js      # Login, OTP dispatch, session verification
    │   │   ├── employee.controller.js  # Employee CRUD & department lookups
    │   │   ├── department.controller.js# Department CRUD & conflict validation
    │   │   ├── attendance.controller.js# Clock-in/out & daily summary aggregation
    │   │   ├── leave.controller.js     # Leave applications & approval workflows
    │   │   ├── payroll.controller.js   # Payroll generation & itemized slips
    │   │   ├── document.controller.js  # Document upload & secure file streaming
    │   │   ├── performance.controller.js # OKRs, goals, reviews, appraisal cycles
    │   │   ├── recruitment.controller.js # ATS pipeline, interviews, candidate conversion
    │   │   ├── report.controller.js    # Cross-domain aggregation & CSV generation
    │   │   ├── notification.controller.js# In-app notifications & read markers
    │   │   ├── audit.controller.js     # Audit log retrieval with role scoping
    │   │   └── health.controller.js    # System health & database connection checks
    │   │
    │   ├── routes/                     # Express API Route Definitions
    │   │   ├── index.js                # Master route dispatcher (/api/...)
    │   │   ├── auth.routes.js          # /api/auth endpoints
    │   │   ├── employee.routes.js      # /api/employees endpoints
    │   │   ├── department.routes.js    # /api/departments endpoints
    │   │   ├── attendance.routes.js    # /api/attendance endpoints
    │   │   ├── leave.routes.js         # /api/leaves endpoints
    │   │   ├── payroll.routes.js       # /api/payroll endpoints
    │   │   ├── document.routes.js      # /api/documents endpoints
    │   │   ├── performance.routes.js   # /api/performance endpoints
    │   │   ├── recruitment.routes.js   # /api/recruitment endpoints
    │   │   ├── report.routes.js        # /api/reports endpoints
    │   │   ├── notification.routes.js  # /api/notifications endpoints
    │   │   ├── audit.routes.js         # /api/audit-logs endpoints
    │   │   ├── health.routes.js        # /api/health endpoint
    │   │   └── test.routes.js          # Integration test verification endpoints
    │   │
    │   ├── services/                   # Business Logic & Integration Layer
    │   │   ├── employee.service.js     # Headcount, sequential IDs, user linking
    │   │   ├── department.service.js   # Safe deactivation checks & headcount sums
    │   │   ├── attendance.service.js   # Work hours calculation & late arrival flags
    │   │   ├── leave.service.js        # Overlap checks & calendar day computation
    │   │   ├── payroll.service.js      # Net/gross arithmetic & payment voucher locks
    │   │   ├── document.service.js     # Disk storage & secure read stream pipes
    │   │   ├── performance.service.js  # Appraisal workflows & anti-tampering guards
    │   │   ├── recruitment.service.js  # 8-stage ATS Kanban & employee conversion
    │   │   ├── report.service.js       # MongoDB aggregation pipelines & RFC 4180 CSV
    │   │   ├── notification.service.js # Automated trigger alerts & inbox management
    │   │   ├── audit.service.js        # Data sanitization (password/token redaction)
    │   │   ├── email.service.js        # Google Gmail SMTP dispatch engine
    │   │   ├── storage.service.js      # Multer disk storage configuration
    │   │   └── health.service.js       # MongoDB connection ping & latency metrics
    │   │
    │   ├── utils/                      # Server Utility Functions
    │   │   ├── jwt.js                  # Token generation & cryptographic verification
    │   │   ├── idGenerator.js          # Sequential ID generator (EMPxxx, DEPTxxx)
    │   │   └── passwordUtils.js        # Password hashing & generation utilities
    │   │
    │   └── scripts/                    # Maintenance & Automated Verification Suites
    │       ├── cleanup_production_data.js# Database sanitizer (purges dummy/test data)
    │       ├── seed.js                 # Database seeder initializing approved accounts
    │       ├── test_invite_only_policy.js # Verification: Invite-only policy & live OTP
    │       ├── test_all_modules_suite.js  # Verification: Stages 4–8 core modules
    │       ├── test_stage9_performance.js # Verification: OKRs, reviews, anti-tampering
    │       ├── test_stage10_recruitment.js# Verification: ATS Kanban & employee conversion
    │       ├── test_stage11_reports_notifications_audit.js # Verification: Reports & logs
    │       ├── test_stage12_hardening_and_e2e.js # Verification: Security hardening
    │       ├── test_auth_suite.js      # Verification: Authentication & RBAC
    │       ├── test_edge_cases.js      # Verification: Token expiry & deactivation
    │       └── test_employee_suite.js  # Verification: Employee CRUD & access scoping
    │
    └── uploads/                        # Private Disk Storage (Git-ignored)
        └── documents/                  # Storage vault for uploaded employee files
```

---

## 3. Module Locations & Responsibility Mapping

| Feature / Domain | Frontend UI Page | API Service Client | Express Controller | Mongoose Model | Backend Service |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & OTP** | `portal/RoleLoginPage.jsx` | `services/authService.js` | `controllers/auth.controller.js` | `models/User.js`, `models/Otp.js` | `services/email.service.js` |
| **Employee Directory** | `pages/employees/` | `services/employeeService.js` | `controllers/employee.controller.js` | `models/Employee.js` | `services/employee.service.js` |
| **Departments** | `pages/departments/` | `services/departmentService.js` | `controllers/department.controller.js` | `models/Department.js` | `services/department.service.js` |
| **Attendance Tracking** | `pages/attendance/` | `services/attendanceService.js` | `controllers/attendance.controller.js` | `models/Attendance.js` | `services/attendance.service.js` |
| **Leaves & Approvals** | `pages/leave/` | `services/leaveService.js` | `controllers/leave.controller.js` | `models/Leave.js` | `services/leave.service.js` |
| **Payroll Processing** | `pages/payroll/` | `services/payrollService.js` | `controllers/payroll.controller.js` | `models/Payroll.js` | `services/payroll.service.js` |
| **Document Vault** | `pages/documents/` | `services/documentService.js` | `controllers/document.controller.js` | `models/EmployeeDocument.js` | `services/document.service.js` |
| **Performance & OKRs** | `pages/performance/` | `services/performanceService.js` | `controllers/performance.controller.js` | `models/PerformanceReview.js` | `services/performance.service.js` |
| **Recruitment ATS** | `pages/recruitment/` | `services/recruitmentService.js` | `controllers/recruitment.controller.js` | `models/JobApplication.js` | `services/recruitment.service.js` |
| **Reports & CSV** | `pages/reports/` | `services/reportService.js` | `controllers/report.controller.js` | Cross-domain aggregations | `services/report.service.js` |
| **In-App Notifications**| `pages/notifications/` | `services/notificationService.js`| `controllers/notification.controller.js` | `models/Notification.js` | `services/notification.service.js`|
| **Audit Logging** | `pages/audit/` | `services/auditService.js` | `controllers/audit.controller.js` | `models/AuditLog.js` | `services/audit.service.js` |

---

## 4. Setup & Installation Guide

### 4.1 Prerequisites
- **Node.js**: v20.x or v24.x installed
- **npm**: v10.x or higher
- **MongoDB Atlas**: Sharded or serverless cluster with connection URI
- **Google Gmail SMTP App Password**: For passwordless email OTP verification

### 4.2 Configuration Files

#### Server Configuration (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.ptyfyms.mongodb.net/hrms_db?retryWrites=true&w=majority
JWT_SECRET=super_secret_enterprise_jwt_signing_key_2026
CLIENT_URL=http://localhost:5173
EMAIL_SERVICE=gmail
EMAIL_USER=your_corporate_email@gmail.com
EMAIL_PASS=your_16_digit_app_password
NODE_ENV=development
```

#### Client Configuration (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### 4.3 Running the Application

1. **Install Dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

2. **Run Full-Stack Environment (Concurrent)**:
   ```bash
   npm run dev
   ```
   - Frontend is accessible at `http://localhost:5173`
   - Backend API is accessible at `http://localhost:5000/api`

3. **Build Frontend for Production**:
   ```bash
   npm --prefix client run build
   ```

---

## 5. Automated Verification Test Suites

Execute any test suite directly from the project root:

```bash
# 1. Invite-Only Access Policy & Google SMTP OTP
node server/src/scripts/test_invite_only_policy.js

# 2. Stages 4–8 Core Workforce Modules
node server/src/scripts/test_all_modules_suite.js

# 3. Stage 9 Performance & OKR Goals
node server/src/scripts/test_stage9_performance.js

# 4. Stage 10 Recruitment ATS & Candidate-to-Employee Conversion
node server/src/scripts/test_stage10_recruitment.js

# 5. Stage 11 Reports, Notifications & Redacted Audit Logs
node server/src/scripts/test_stage11_reports_notifications_audit.js

# 6. Stage 12 Final Hardening & End-to-End Security
node server/src/scripts/test_stage12_hardening_and_e2e.js

# 7. Authentication & Token Lifecycle
node server/src/scripts/test_auth_suite.js

# 8. Token Expiry & Account Deactivation
node server/src/scripts/test_edge_cases.js

# 9. Employee CRUD & Resource-Level Scoping
node server/src/scripts/test_employee_suite.js
```

---

## 6. Master Verified User Credentials Reference

The following 6 verified accounts represent the active organizational structure, powered by verified real Gmail accounts for 100% reliable SMTP email delivery:

| Role | Employee ID | Name | Corporate Email | Default Password | Assigned Department | Reports To |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `EMP007` | Aditya Arora | `a4adityaarora@gmail.com` | `Corp@EMP007#` | Technology & Systems | *Top Level Executive* |
| **HR** | `EMP023` | Tanishq Goyal | `tnu23505@gmail.com` | `Corp@EMP023#` | Human Resources | Aditya Arora (`EMP007`) |
| **Manager** | `EMP019` | Akshat Wadagbalkar | `akshat.wadagbalkar@gmail.com` | `Corp@EMP019#` | Technology & Systems | Aditya Arora (`EMP007`) |
| **Manager** | `EMP018` | Chiranthan Suvidh | `suvidh.vibrance@gmail.com` | `Corp@EMP018#` | Engineering | Aditya Arora (`EMP007`) |
| **Employee**| `EMP021` | Abhik Sinha | `abhiksinha06@gmail.com` | `Corp@EMP021#` | Engineering | **Chiranthan Suvidh** (`EMP018`) |
| **Employee**| `EMP020` | Uttkarsh Kumar | `u23022686@gmail.com` | `Corp@EMP020#` | Technology & Systems | **Akshat Wadagbalkar** (`EMP019`) |
