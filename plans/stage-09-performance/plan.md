# Stage 9: Performance Management & OKR Appraisals — Internal Project Plan

## Stage Title
**Stage 9 — Performance Management, Goal Setting & OKR Appraisals**

## Current Status
**In Progress** (Core API endpoints and initial UI implemented; advanced enterprise appraisal workflows and automation pending)

---

## What Has Already Been Completed
1. **Core Data Models**:
   - `PerformanceReviewCycle`: Supports quarterly and annual review cycle definitions with start/end date constraints.
   - `EmployeeGoal`: Tracks individual and departmental OKRs with categories (Technical, Leadership, Operational) and percentage completion progress (`0–100%`).
   - `PerformanceReview`: Captures manager feedback, 1–5 numerical ratings, qualitative notes, and employee acknowledgment status.
2. **Scoping & Security Rules**:
   - Managers can only view and evaluate their direct assigned team members.
   - Employees have read-only access to their personal reviews and can update only their own goal progress.
   - Anti-tampering locking rule: Once an employee acknowledges a performance review, managers are strictly prevented from altering scores or comments.
3. **Basic UI Views**:
   - Review cycles overview.
   - Goals progress slider widget.
   - Manager review evaluation form.

---

## What Is Pending
1. **360-Degree Peer Feedback System**:
   - Anonymous and non-anonymous peer review submission mechanism.
   - Cross-functional reviewer invitation matrix with HR approval.
2. **Bell-Curve Normalization & Calibration**:
   - Department-wide rating distribution curve calculation (e.g., Top 10%, Core 70%, Bottom 20%).
   - Manager calibration dashboard to prevent rating inflation.
3. **Performance Improvement Plan (PIP) Workflow**:
   - Automated triggers for ratings below 2.5/5.0.
   - 30/60/90-day milestone tracker with manager check-ins and HR sign-offs.
4. **AI-Powered Appraisal Summaries**:
   - Integration with Google Gemini / DeepMind APIs to summarize quarterly employee achievements against OKRs.
   - Sentiment analysis and bias detection in manager narrative feedback.
5. **PDF Export of Appraisals**:
   - Formal appraisal letter generation with digital signatures.

---

## Future Implementation Plan

### Phase 1: 360-Degree Feedback Module
- Create `PeerReviewRequest` schema linked to `PerformanceReviewCycle`.
- Build UI for employees to nominate up to 3 peer reviewers.
- HR approval queue for reviewer nominations before dispatch.

### Phase 2: Calibration & Bell Curve Engine
- Implement MongoDB aggregation pipeline to calculate department score distributions.
- Build interactive visual bell curve graph in HR dashboard.
- Enable batch score adjustment before final sign-off.

### Phase 3: Performance Improvement Plans (PIP)
- Schema: `ImprovementPlan` with objectives, bi-weekly milestones, and status.
- Notification alerts for upcoming milestone reviews.

---

## Next Action Items
1. [ ] Finalize UI wireframes for 360-degree peer nominations.
2. [ ] Define permissions matrix for HR vs Manager in score calibration.
3. [ ] Design database schema for `PeerReviewRequest` and `ImprovementPlan`.
4. [ ] Build exportable PDF template for employee appraisal archives.
