# Enterprise HRMS — System Functioning & Operational Architecture

## 1. Executive Summary & Architectural Overview

The **Enterprise Human Resource Management System (HRMS)** is an invite-only, production-hardened web application built on the modern MERN architecture (**MongoDB Atlas, Express 5, React 19, Node.js v24, Vite 8**). It provides end-to-end workforce administration across 12 integrated enterprise modules:

1. **Authentication & Session Governance** (Stateless JWT + Dual-Mode Login with Password & Google Gmail SMTP OTP).
2. **Role-Based Access Control (RBAC)** (4 strict authorization tiers: `admin`, `hr`, `manager`, `employee`).
3. **Employee Master Directory** (Sequential `EMPxxx` generation, auto-provisioned linked user credentials, soft deactivation).
4. **Department Hierarchy** (Sequential `DEPTxxx`, department heads, safe-deactivation conflict checks).
5. **Attendance Tracking & Timesheets** (Compound `{ employee, date }` uniqueness, automated work hours calculation).
6. **Leave Management & Approvals** (Inclusive date calculations, overlap detection, self-approval blocking, manager review).
7. **Payroll & Compensation Engine** (Server-side gross/net calculations, strict confidentiality, digital paystubs).
8. **Secure Document Vault** (Encrypted disk storage in private directory, authenticated streaming, MIME validation).
9. **Performance Management & OKRs** (Review cycles, goals progress tracking, manager reviews, anti-tampering lock).
10. **Recruitment ATS & Hiring Pipeline** (Sequential `JOBxxx` / `CANxxx` / `APPxxx`, 8-stage Kanban, candidate-to-employee conversion).
11. **Operational Analytics & RFC 4180 CSV Reports** (Role-scoped reports, headcount aggregations, RFC 4180 CSV exports).
12. **In-App Notification Center & Audit Logging** (Real-time bell notification badge, automatic data redaction for passwords & tokens).

---

## 2. End-to-End Execution Flow

### 2.1 Server Boot & Request Processing Pipeline

When the backend starts (`npm run server` or `node server/src/server.js`):

```
+-------------------------------------------------------------+
|                      Node.js v24 Runtime                    |
+-------------------------------------------------------------+
                               |
                               v
               Public DNS Resolver Fallback (8.8.8.8)
                               |
                               v
               MongoDB Atlas Connection Initialized
             (Mongoose 9, SSL/TLS, Sharded Cluster)
                               |
                               v
           Express 5 Middleware Pipeline Initialized:
             1. Helmet (Security Headers, DNS Prefetch, XSS)
             2. CORS Origin Whitelist (http://localhost:5173)
             3. Express JSON & URL-Encoded Parsers (10MB limit)
             4. Request Sanitization & Audit Logger Middleware
             5. Health Check Endpoint (GET /api/health)
             6. API Route Modules Mounted (/api/*)
             7. Global 404 & Centralized Error Handler (errorHandler)
                               |
                               v
              HTTP Listener Starts on Port 5000
```

1. **DNS Resilience Hook**: In Windows environments connecting to MongoDB Atlas (`mongodb+srv`), Node's native DNS can fail or timeout during SRV record resolution. The server dynamically registers public DNS resolvers (`8.8.8.8`, `1.1.1.1`) at startup.
2. **Database Connection**: `server/src/config/db.js` initializes Mongoose with Atlas connection pooling, handling reconnects and retry logic.
3. **Security Headers (`helmet`)**: Configures `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and disables browser cache leaks.
4. **Audit Middleware**: Every state-altering API call (`POST`, `PUT`, `PATCH`, `DELETE`) is intercepted by `audit.service.js` which automatically redacts passwords, tokens, and authorization headers before persisting an immutable audit entry.
5. **Centralized Error Handling**: Unhandled exceptions, MongoDB duplicate key errors (`11000`), validation errors, and CastErrors are normalized into uniform JSON payloads with user-friendly messages and appropriate HTTP status codes.

---

### 2.2 Client Boot & State Hydration Pipeline

When the browser loads `http://localhost:5173`:

```
+-------------------------------------------------------------+
|               Vite 8 Single-Page Application                |
+-------------------------------------------------------------+
                               |
                               v
                         index.html
                               |
                               v
                       client/src/main.jsx
                               |
                               v
    +----------------------------------------------------+
    |                     App.jsx                        |
    |  - BrowserRouter (React Router DOM v7)            |
    |  - AuthProvider (Context: user, token, roles)      |
    |  - NotificationProvider (Context: unread, alerts)  |
    |  - Toaster (Sonner: Toast notifications)           |
    +----------------------------------------------------+
                               |
                               v
                      Route Matching Engine
          /  -> RoleSelectionPortal (Enterprise Gateway)
          /:role/login -> RoleLoginPage (Password or OTP)
          /dashboard -> Protected Route -> Dynamic Role Dashboard
```

1. **Session Hydration**: On initialization, `AuthContext.jsx` checks `localStorage` for `token` and `user`. If present, it executes `GET /api/auth/me` to verify that the token has not expired and that the account is currently active.
2. **Axios Interceptor**: `services/api.js` attaches `Authorization: Bearer <token>` to all outgoing requests. If any request receives a `401 Unauthorized` response, it automatically purges the invalid session and redirects to `/login`.
3. **Protected Routing**: `<ProtectedRoute>` inspects `isAuthenticated` and `allowedRoles`. Unauthorized access attempts are redirected to their appropriate role home or `/unauthorized`.

---

## 3. Authentication & Security Architecture

### 3.1 Strict Invite-Only Policy
Public self-registration (`POST /api/auth/register`) is permanently disabled with `403 Forbidden`. Only authorized HR Administrators and Executives can provision new employee records through the Employee Management Wizard. Creating an employee automatically generates their corporate login credentials.

### 3.2 Dual-Mode Login Mechanisms

```
                       User Enters Login Portal
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
          Mode A: Password               Mode B: Email OTP
                   |                             |
     POST /api/auth/login            POST /api/auth/send-otp
   (email/empId + password)              (corporate email)
                   |                             |
        bcrypt.compare()            Generate 6-digit cryptocode
    (10 rounds salted hash)         Persist in MongoDB (10m TTL)
                   |                Send via Gmail SMTP (Nodemailer)
                   |                             |
                   |                             v
                   |                   User Receives Email OTP
                   |                             |
                   |                 POST /api/auth/verify-otp
                   |                    (email + 6-digit OTP)
                   |                             |
                   +--------------+--------------+
                                  |
                                  v
                    Generate Stateless JWT Token
                    (Signed HS256, 24h Expiry)
                                  |
                                  v
                 Return Token + Sanitized User Object
                (Password hash excluded from response)
```

1. **Standard Password Authentication**:
   - Accepts either corporate email (`a4adityaarora@gmail.com`) or Employee ID (`EMP007`).
   - Normalizes identifiers to prevent case-sensitivity bypasses.
   - Evaluates password using `bcrypt.compare`.
   - Generates a stateless JWT token encoding `{ id, email, role, employeeId }`.
2. **Passwordless Email OTP Authentication**:
   - User inputs their registered email address.
   - Server checks if user exists and is active.
   - Cryptographically random 6-digit numeric OTP is generated.
   - Stored in the `Otp` collection with a 10-minute TTL index (`expires: '10m'`).
   - Delivered securely via Google Gmail SMTP (`nodemailer`) with custom HTML corporate styling.
   - User submits code; server validates match and consumes OTP to prevent replay attacks.
3. **Session Hygiene**:
   - The password field has `select: false` on the Mongoose model; passwords are never sent in API responses.
   - Logged-out users have their client tokens immediately discarded from memory and storage.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Module / Operation | Admin (Executive) | HR Administrator | Manager (Team Lead) | Employee (Self) |
| :--- | :---: | :---: | :---: | :---: |
| **System Audit Logs** | Full Access | Full Access | No Access (403) | No Access (403) |
| **User Account Provisioning** | Full Access | Full Access | No Access (403) | No Access (403) |
| **Department Administration** | Full CRUD | Full CRUD | Read-Only | Read-Only |
| **Employee Master Directory** | Full CRUD | Full CRUD | Direct Team Only | Self Profile Only |
| **Attendance Monitoring** | Org-Wide | Org-Wide | Direct Team Only | Clock-In / Self Only |
| **Leave Approvals** | Org-Wide | Org-Wide | Direct Team Approvals | Apply / Cancel Self |
| **Payroll Processing** | Org-Wide | Org-Wide | No Access (403) | View Personal Paystubs |
| **Document Vault** | Org-Wide | Upload / Manage | Direct Team Only | View / Download Self |
| **Performance Review Cycles** | Full Access | Create Cycles | Conduct Team Reviews | Self-Acknowledge OKRs |
| **Recruitment ATS & Pipeline** | Full Access | Full ATS Pipeline | Interview Feedback | No Access (403) |
| **Analytical Reports & CSV** | Full Reports | Full Reports | Team Overview Only | Personal Summary Only |

---

## 5. Detailed Operational User Journeys (Chronological Order)

### Journey 1: Admin System Initialization & Governance
1. **Login**: Admin logs in via `/admin/login` using `a4adityaarora@gmail.com` / `Corp@EMP007#`.
2. **Dashboard Overview**: Admin views organizational headcount, active departments, user provisioned stats, and real-time attendance rate.
3. **Department Hierarchy**: Navigates to `/departments`, creates new organizational business units (`Engineering`, `Human Resources`, `Technology & Systems`). The system automatically assigns sequential `DEPT001`, `DEPT002`, etc.
4. **Security & Audit Logs**: Navigates to `/audit-logs` to inspect recent system interactions, authentication attempts, and data modifications with full IP and user-agent metadata.

### Journey 2: HR Recruitment ATS & Candidate-to-Employee Conversion
1. **Requisition Publishing**: HR logs in (`tnu23505@gmail.com` / `Corp@EMP023#`) and opens `/recruitment/jobs/new`. Creates a job posting (e.g., `Senior Systems Engineer`). The system assigns sequential ID `JOB001`.
2. **Candidate Registration**: Candidate applies or is entered at `/recruitment/candidates`. Duplicate email validation prevents multiple candidate records.
3. **Application Pipeline**: Application is submitted and placed in the **Applied** column of the 8-stage Kanban board (`/recruitment/applications`).
4. **Stage Transitions**: HR moves candidate: `Applied` $\rightarrow$ `Screening` $\rightarrow$ `Shortlisted`.
5. **Interview Scheduling**: HR schedules an interview with Manager `Chiranthan Suvidh`. The system automatically moves the application to `Interview` stage. Interviewer leaves score and feedback.
6. **Conversion to Employee**: Once the candidate reaches `Selected` / `Offer`, HR clicks **Convert to Employee**. The system:
   - Validates that the application has not already been converted.
   - Automatically provisions an `Employee` document with sequential ID (e.g. `EMP024`).
   - Automatically provisions a linked `User` document with role `employee` and auto-generated password `Corp@EMP024#`.
   - Dispatches a corporate onboarding email to the candidate's personal inbox.
   - Transitions application stage to `Hired`.

### Journey 3: Employee Shift Check-In & Attendance Management
1. **Daily Check-In**: Employee logs in via `/employee/login` using `abhiksinha06@gmail.com` / `Corp@EMP021#`.
2. **Clock-In**: Navigates to `/attendance`. Today's status indicates "Not Clocked In". Employee clicks **Clock In**. Check-in timestamp is recorded with status `present`.
3. **Clock-Out**: At shift end, employee clicks **Clock Out**. The server calculates total work hours (e.g. `8.5h`) and flags if checkout was premature.
4. **Compound Index Guard**: If an employee attempts to clock in twice on the same calendar day, the compound index `{ employee: 1, date: 1 }` rejects the duplicate with `409 Conflict`.

### Journey 4: Leave Application & Manager Approval Workflow
1. **Application**: Employee `Abhik Sinha` opens `/leave/apply`. Selects `Casual Leave`, start date `2026-09-10`, end date `2026-09-12`. The UI dynamically calculates `3 Days`.
2. **Submission**: The server checks for existing overlapping leave requests. If clean, status is set to `pending`.
3. **Self-Approval Block**: If the employee attempts to send a `PATCH` request to approve their own leave, the server rejects it with `403 Forbidden: Employees cannot approve their own leave`.
4. **Manager Review**: Manager `Chiranthan Suvidh` logs in (`suvidh.vibrance@gmail.com` / `Corp@EMP018#`). His dashboard displays `Pending Approvals`. He reviews the request, adds a review comment, and approves it.
5. **Notification**: The employee receives an in-app and email notification confirming leave approval.

### Journey 5: Payroll Processing & Digital Paystub Issuance
1. **Payroll Generation**: HR navigates to `/payroll` and generates monthly payroll for an employee.
2. **Server-Side Arithmetic**: HR inputs Basic Salary, Allowances, Overtime, and Bonus. The server validates calculations:
   - Gross Salary = Basic + Allowances + Overtime + Bonus
   - Net Salary = Gross Salary - Deductions - Tax
3. **Disbursement**: HR marks status as `paid` with direct-deposit payment date.
4. **Employee Inspection**: Employee logs into `/payroll` to view itemized digital paystubs.
5. **Confidentiality Enforcement**: Managers attempting to call `GET /api/payroll` receive an empty set, preventing compensation leaks.

### Journey 6: Performance Appraisals & Anti-Tampering Lock
1. **Cycle Creation**: HR creates an annual review cycle (`/performance/cycles`).
2. **Goal Assignment**: Manager assigns an OKR goal (`Optimize API Latency to <100ms`) to a direct report.
3. **Progress Update**: Employee updates goal progress from `0%` to `80%`.
4. **Manager Evaluation**: Manager reviews the goal and completes performance review with rating `4/5`.
5. **Employee Acknowledgment**: Employee reviews feedback and clicks **Acknowledge Review**, locking the submission.
6. **Anti-Tampering Guard**: Once acknowledged, manager attempts to alter the rating are rejected with `400 Bad Request: Cannot modify a review once acknowledged by the employee`.

### Journey 7: Document Vault Storage & Authenticated Streaming
1. **Upload**: HR uploads signed offer letters or contracts via `POST /api/documents`. Multer stores the file in `server/uploads/documents/` with randomized unique names.
2. **Security Isolation**: The upload folder is not served as static files. Direct browser requests to the file path are rejected.
3. **Authenticated Streaming**: When an employee downloads their document (`GET /api/documents/:id/download`), the server verifies identity, sets `Content-Disposition: attachment`, and streams the file binary.

### Journey 8: Operational Reporting & RFC 4180 CSV Export
1. **Overview Metrics**: Admin and HR view real-time headcount, department distributions, attendance trends, and payroll expenses.
2. **Data Export**: Users click **Export CSV**. The server generates RFC 4180 compliant CSV files with properly escaped commas and quotes, providing clean spreadsheet downloads.

---

## 6. Master Verified User Credentials Reference

The database contains ONLY verified real Gmail accounts linked to realistic organizational departments with a strict reporting hierarchy:

| Role | Employee ID | Name | Corporate Email | Password | Department | Reports To |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `EMP007` | Aditya Arora | `a4adityaarora@gmail.com` | `Corp@EMP007#` | Technology & Systems | *Top Level Executive* |
| **HR** | `EMP023` | Tanishq Goyal | `tnu23505@gmail.com` | `Corp@EMP023#` | Human Resources | Aditya Arora (`EMP007`) |
| **Manager** | `EMP019` | Akshat Wadagbalkar | `akshat.wadagbalkar@gmail.com` | `Corp@EMP019#` | Technology & Systems | Aditya Arora (`EMP007`) |
| **Manager** | `EMP018` | Chiranthan Suvidh | `suvidh.vibrance@gmail.com` | `Corp@EMP018#` | Engineering | Aditya Arora (`EMP007`) |
| **Employee**| `EMP021` | Abhik Sinha | `abhiksinha06@gmail.com` | `Corp@EMP021#` | Engineering | **Chiranthan Suvidh** (`EMP018`) |
| **Employee**| `EMP020` | Uttkarsh Kumar | `u23022686@gmail.com` | `Corp@EMP020#` | Technology & Systems | **Akshat Wadagbalkar** (`EMP019`) |

---

## 7. Automated Test Suite Verification

All operational flows described in this document are programmatically verified across 9 test suites:

- `node server/src/scripts/test_invite_only_policy.js` — 5/5 PASSED (Invite-only policy & live OTP).
- `node server/src/scripts/test_all_modules_suite.js` — 22/22 PASSED (Stages 4–8 integration).
- `node server/src/scripts/test_stage9_performance.js` — 24/24 PASSED (Review cycles, goals, anti-tamper).
- `node server/src/scripts/test_stage10_recruitment.js` — 30/30 PASSED (ATS Kanban & employee conversion).
- `node server/src/scripts/test_stage11_reports_notifications_audit.js` — 33/33 PASSED (Reports, CSV, alerts).
- `node server/src/scripts/test_stage12_hardening_and_e2e.js` — 21/21 PASSED (ID manipulation & header audits).
- `node server/src/scripts/test_auth_suite.js` — 26/26 PASSED (Authentication & token verification).
- `node server/src/scripts/test_edge_cases.js` — 2/2 PASSED (Token expiry & account deactivation).
- `node server/src/scripts/test_employee_suite.js` — 18/18 PASSED (Employee CRUD & scoping).
- **Total**: 181+ Automated Tests Passing with 0 Failures.
