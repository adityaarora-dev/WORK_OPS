# Stage 10: Recruitment ATS & Hiring Pipeline — Internal Project Plan

## Stage Title
**Stage 10 — Applicant Tracking System (ATS), Interview Coordination & Candidate Onboarding**

## Current Status
**In Progress** (Core pipeline stages, models, and conversion logic implemented; automated integrations and AI parsing pending)

---

## What Has Already Been Completed
1. **Core Data Models**:
   - `JobOpening`: Requisitions with sequential IDs (`JOBxxx`), department association, position counts, and salary ranges.
   - `Candidate`: Candidate talent records with resume links, contact details, and deduplication by email.
   - `JobApplication`: Pipeline tracking connecting candidates with requisitions across 8 lifecycle stages (`Applied` $\rightarrow$ `Screening` $\rightarrow$ `Shortlisted` $\rightarrow$ `Interview` $\rightarrow$ `Selected` $\rightarrow$ `Offer` $\rightarrow$ `Hired` $\rightarrow$ `Rejected`).
   - `Interview`: Interview coordination tracking interviewers, timestamps, format (video/in-person), and scorecards.
2. **Candidate-to-Employee Conversion Logic**:
   - One-click transformation from `Selected`/`Offer` application to active `Employee` record.
   - Auto-generation of next sequential `EMPxxx` ID.
   - Automatic user account provisioning with corporate default credentials.
   - Dispatch of welcome onboarding email with login instructions.
3. **Interactive Kanban Interface**:
   - Visual drag/advance stages for HR administrators.

---

## What Is Pending
1. **AI Resume Parsing & Skill Extraction**:
   - Automated PDF/DOCX resume text extraction.
   - Keyword and experience matching against job requirements.
   - Automatic candidate score generation.
2. **Calendar Sync for Interviews**:
   - Two-way Google Calendar / Microsoft Outlook integration for interviewer availability.
   - Automated video call link generation (Google Meet / Zoom).
3. **Offer Letter Generation & Digital Signatures**:
   - Dynamic PDF offer letter generation based on compensation templates.
   - Integration with DocuSign or internal canvas e-signature pad.
4. **Public Career Portal**:
   - External job board for public applicants.
   - CAPTCHA protection and file upload sanitization for public submissions.
5. **Background Verification (BGV) Tracker**:
   - Sub-workflow to track education, employment, and police verification status.

---

## Future Implementation Plan

### Phase 1: Resume Parser & Matching Engine
- Integrate `pdf-parse` or cloud vision API to parse candidate resumes upon upload.
- Store structured skill tags and calculate match percentages against requisition criteria.

### Phase 2: Calendar & Scheduling Automation
- Add Google OAuth2 service account integration for calendar scheduling.
- Send calendar invites `.ics` attachments in automated interview emails.

### Phase 3: Offer Letter & Onboarding Portal
- Create PDF template generator using `pdfkit` or `puppeteer`.
- Build a dedicated pre-onboarding portal for candidates to upload identity documents before Day 1.

---

## Next Action Items
1. [ ] Prototype `pdf-parse` microservice for resume text ingestion.
2. [ ] Design external career portal UI wireframes.
3. [ ] Define HTML-to-PDF template for official corporate offer letters.
4. [ ] Implement webhook receiver for interview calendar RSVPs.
