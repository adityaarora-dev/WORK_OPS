# Enterprise HRMS — Master Verified User Credentials

This document contains the verified credentials for all active accounts in the **Enterprise Human Resource Management System**.

---

## 1. Executive, HR & Management Accounts

| Role | Employee ID | Name | Corporate Email | Password | Primary Console |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin (CTO)** | `EMP001` | Aarav Sharma | `aarav.sharma@company.com` | `Admin@123456` | `/admin/dashboard` |
| **HR Lead** | `EMP002` | Priya Patel | `priya.patel@company.com` | `HrAdmin@1810#` | `/hr/dashboard` |
| **Team Manager** | `EMP003` | Rajesh Iyer | `rajesh.iyer@company.com` | `Manager@123456` | `/manager/dashboard` |

---

## 2. Approved Employee Accounts (Self-Service)

All employee accounts are active direct reports under Manager **Rajesh Iyer** (`EMP003`):

| Employee ID | Name | Email Address | Password | Designation | Department |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `EMP007` | Aditya Arora | `a4adityaarora@gmail.com` | `Corp@EMP007#` | Senior Systems Engineer | Technology & Systems |
| `EMP017` | Chiranthan Suvidh | `chiranthansuvidh.s2024@vitstudent.ac.in` | `Corp@EMP017#` | Senior Software Developer | Engineering |
| `EMP018` | Chiranthan Suvidh | `suvidh.vibrance@gmail.com` | `Corp@EMP018#` | Senior Software Developer | Engineering |
| `EMP019` | Akshat Wadagbalkar | `akshat.wadagbalkar@gmail.com` | `Corp@EMP019#` | Cloud Architect | Technology & Systems |
| `EMP020` | Uttkarsh Kumar | `u23022686@gmail.com` | `Corp@EMP020#` | AI Engineer | Engineering |
| `EMP021` | Abhik Sinha | `abhiksinha06@gmail.com` | `Corp@EMP021#` | Backend Engineer | Engineering |
| `EMP023` | Tanishq Goyal | `tnu23505@gmail.com` | `Corp@EMP023#` | SDE | Engineering |

---

## 3. Login Modes & Access Instructions

### A. Password-Based Login
- Portal URL: `http://localhost:5173/` or direct role pages:
  - Admin: `http://localhost:5173/admin/login`
  - HR: `http://localhost:5173/hr/login`
  - Manager: `http://localhost:5173/manager/login`
  - Employee: `http://localhost:5173/employee/login`
- Enter the Email Address or Employee ID, provide the Password, and click **Sign In**.

### B. Passwordless Email OTP Login
- Select **Login with Email OTP** on any role login screen.
- Enter any registered corporate email (e.g. `a4adityaarora@gmail.com` or `priya.patel@company.com`).
- Click **Send Verification Code**.
- Retrieve the 6-digit verification code from your Gmail inbox and enter it to authenticate immediately without a password.
