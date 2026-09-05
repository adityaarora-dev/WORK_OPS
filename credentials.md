# Enterprise HRMS — Master Verified User Credentials

This document contains the verified credentials and reporting structure for all active accounts in the **Enterprise Human Resource Management System**. Every account is backed by a verified real Gmail address, ensuring 100% reliable SMTP email delivery for OTP logins, password resets, leave approvals, and system notifications.

---

## 1. Verified Corporate User Accounts (Exactly 6 Users)

| Role | Employee ID | Name | Registered Gmail | Password | Designation | Department | Primary Console |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | `EMP007` | Aditya Arora | `a4adityaarora@gmail.com` | `Corp@EMP007#` | Chief Technology Officer & Director | Technology & Systems | `/admin/dashboard` |
| **HR** | `EMP023` | Tanishq Goyal | `tnu23505@gmail.com` | `Corp@EMP023#` | Head of People Operations & HR Lead | Human Resources | `/hr/dashboard` |
| **Manager** | `EMP019` | Akshat Wadagbalkar | `akshat.wadagbalkar@gmail.com` | `Corp@EMP019#` | Cloud & Infrastructure Manager | Technology & Systems | `/manager/dashboard` |
| **Manager** | `EMP018` | Chiranthan Suvidh | `suvidh.vibrance@gmail.com` | `Corp@EMP018#` | Software Development Manager | Engineering | `/manager/dashboard` |
| **Employee**| `EMP021` | Abhik Sinha | `abhiksinha06@gmail.com` | `Corp@EMP021#` | Backend Software Engineer | Engineering | `/employee/dashboard` |
| **Employee**| `EMP020` | Uttkarsh Kumar | `u23022686@gmail.com` | `Corp@EMP020#` | AI & Cloud Engineer | Technology & Systems | `/employee/dashboard` |

---

## 2. Strict Employee Reporting Structure

The reporting hierarchy is enforced consistently across profiles, manager dashboards, leave approvals, task ownership, and notification routing:

| Employee | Employee ID | Reports To (Manager) | Manager ID | Manager Email |
| :--- | :--- | :--- | :--- | :--- |
| **Abhik Sinha** | `EMP021` | **Chiranthan Suvidh** | `EMP018` | `suvidh.vibrance@gmail.com` |
| **Uttkarsh Kumar** | `EMP020` | **Akshat Wadagbalkar** | `EMP019` | `akshat.wadagbalkar@gmail.com` |
| **Akshat Wadagbalkar** | `EMP019` | **Aditya Arora** | `EMP007` | `a4adityaarora@gmail.com` |
| **Chiranthan Suvidh** | `EMP018` | **Aditya Arora** | `EMP007` | `a4adityaarora@gmail.com` |
| **Tanishq Goyal** | `EMP023` | **Aditya Arora** | `EMP007` | `a4adityaarora@gmail.com` |
| **Aditya Arora** | `EMP007` | *None (Top Level Executive)* | — | — |

---

## 3. Login Modes & Access Instructions

* **Live Render API Endpoint**: `https://hr-2027.onrender.com/api`
* **Live System Health Check**: `https://hr-2027.onrender.com/api/health`

### A. Password-Based Login
* Unified Portal URL: `http://localhost:5173/` (or your deployed Vercel URL)
* Role-Specific Direct Portals:
  * **Admin**: `http://localhost:5173/admin/login` (or `/admin/login` on Vercel)
  * **HR**: `http://localhost:5173/hr/login` (or `/hr/login` on Vercel)
  * **Manager**: `http://localhost:5173/manager/login` (or `/manager/login` on Vercel)
  * **Employee**: `http://localhost:5173/employee/login` (or `/employee/login` on Vercel)
* Enter either the **Registered Gmail Address** or **Employee ID**, provide the Password, and click **Sign In**.

### B. Passwordless Email OTP Login
* Click **Login with Email OTP** on any login portal.
* Enter your registered Gmail address (e.g. `a4adityaarora@gmail.com`, `tnu23505@gmail.com`, etc.).
* Click **Send Verification Code**.
* A 6-digit OTP code is dispatched directly to your real Gmail inbox via Google SMTP.
* Enter the OTP code to authenticate immediately.

### C. Forgot Password & Self-Service Password Reset
* Click **Forgot Password?** above the password field on any login portal.
* Enter your registered Gmail address or Employee ID.
* Check your Gmail inbox for the email: *Reset Your Enterprise HRMS Password*.
* Click the secure time-limited link (valid for 15 minutes) to set a new password.
