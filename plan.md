# Enterprise HRMS — Project Implementation Review & Master Roadmap

This document serves as the internal project management roadmap. It tracks the implementation status of all development stages, outlines completed features, and separates future planning items from active application code.

---

## 1. Stage Implementation Status Overview

| Stage | Title | Domain / Module | Status | Notes |
| :---: | :--- | :--- | :---: | :--- |
| **Stage 1** | Foundation & Full-Stack Integration | Architecture, Express, Mongoose, Vite | **Completed** | Full-stack monorepo, MongoDB Atlas, health check. |
| **Stage 2** | Authentication, RBAC & Recovery | JWT, 4-Tier Roles, Google SMTP OTP, Forgot Password | **Completed** | Production-ready auth, OTP, reset link flow. |
| **Stage 3** | Employee Master Directory | Onboarding, Profile Scoping, Auto-Credentials | **Completed** | Sequential `EMPxxx`, linked users, soft-deactivate. |
| **Stage 4** | Department Management | Hierarchy, Business Units, Conflict Guards | **Completed** | Sequential `DEPTxxx`, safe-deactivation checks. |
| **Stage 5** | Attendance Tracking & Timesheets | Daily Check-In/Out, Automated Hours | **Completed** | Compound `{ employee, date }` uniqueness. |
| **Stage 6** | Leave Management & Approvals | PTO, Sick, Casual, Overlap & Self-Approval Guards | **Completed** | Auto calendar calculation, manager reviews. |
| **Stage 7** | Payroll & Compensation Engine | Salary Breakdown, Confidentiality Scoping | **Completed** | Server-side arithmetic, printable digital paystubs. |
| **Stage 8** | Secure Document Vault | Multer Encrypted Storage, Authenticated Streaming | **Completed** | MIME validation, streaming download pipes. |
| **Stage 9** | Performance Management & OKRs | Review Cycles, Goal Progress, Appraisals | **In Progress** | Core built; 360 feedback & bell curve pending. |
| **Stage 10**| Recruitment ATS & Hiring Funnel | Requisitions, 8-Stage Kanban, Candidate Conversion | **In Progress** | Core pipeline built; AI parsing & calendar sync pending. |
| **Stage 11**| Advanced Analytics & Push Alerts | Real-Time Sockets, Predictive Risk Models | **In Progress** | CSV reports built; WebSockets & push alerts pending. |
| **Stage 12**| Enterprise SSO & Mobile App | SAML 2.0 / OIDC, React Native Mobile App | **Not Started** | Security baseline built; SSO & mobile apps pending. |

---

## 2. Core Initial Implemented Baseline (Stages 1–8)

The initial baseline forms the rock-solid foundation of the Enterprise HRMS and is **100% functional, integrated, and verified**:

1. **Authentication & Session Governance (Stage 1 & 2)**:
   - Stateless JWT authentication with salted `bcrypt` password hashing (10 rounds).
   - Passwordless login via live Google Gmail SMTP 6-digit OTP delivery.
   - Production-ready **Forgot Password & Reset Link** flow with time-limited crypto tokens (15 minutes).
   - Strict invite-only policy (public self-registration disabled with `403 Forbidden`).
2. **Workforce Administration (Stage 3 & 4)**:
   - Employee directory with auto-generated sequential IDs (`EMP001`, `EMP002`, ...).
   - Department hierarchy with conflict protection preventing deactivation of departments containing active employees.
3. **Time, Leave & Compensation (Stage 5, 6, 7)**:
   - 1-click attendance clock-in/out with automated work hours calculation.
   - Leave applications with overlap protection and strict self-approval blocking.
   - Monthly payroll generation with gross/net arithmetic and manager confidentiality guards.
4. **Document Vault (Stage 8)**:
   - Encrypted disk storage in private directory with authenticated streaming downloads.

---

## 3. External Planning & Future Roadmap Files

To maintain a clean codebase, planning items, unbuilt features, and future roadmap tasks are organized in dedicated plan files inside the `plans/` directory:

* **Stage 9 Plan**: [`plans/stage-09-performance/plan.md`](./plans/stage-09-performance/plan.md)
  * Focus: 360-degree peer feedback, departmental bell-curve calibration, performance improvement plans (PIP), and AI-generated appraisal summaries.
* **Stage 10 Plan**: [`plans/stage-10-recruitment/plan.md`](./plans/stage-10-recruitment/plan.md)
  * Focus: AI resume parser, Google/Outlook calendar interview syncing, dynamic offer letter PDF generation, and public career portal.
* **Stage 11 Plan**: [`plans/stage-11-advanced-analytics-notifications/plan.md`](./plans/stage-11-advanced-analytics-notifications/plan.md)
  * Focus: WebSocket/SSE real-time notification streams, attrition risk prediction, and automated weekly report digests.
* **Stage 12 Plan**: [`plans/stage-12-enterprise-hardening-sso/plan.md`](./plans/stage-12-enterprise-hardening-sso/plan.md)
  * Focus: Enterprise SSO (SAML 2.0 / Okta / Azure AD), mobile applications with geofenced clock-in, and authenticator app (TOTP) MFA.

---

## 4. Next Milestone Action Items

1. **Phase A (Current Sprint)**:
   - [x] Implement production-ready Forgot Password workflow with SMTP email dispatch.
   - [x] Consolidate project documentation into clean architecture and operational guides.
   - [x] Separate future planning roadmaps into external `plan.md` documents.
2. **Phase B (Upcoming Sprint)**:
   - [ ] Begin Phase 1 of Stage 10 (AI Resume Parsing microservice prototype).
   - [ ] Begin Phase 1 of Stage 9 (360-degree peer feedback nomination schema).
   - [ ] Implement WebSocket server for real-time leave approval push notifications.
