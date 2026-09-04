import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Core Pages & Portals
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RoleSelectionPortal from './pages/portal/RoleSelectionPortal';
import RoleLoginPage from './pages/portal/RoleLoginPage';
import ForgotPasswordPage from './pages/portal/ForgotPasswordPage';
import ResetPasswordPage from './pages/portal/ResetPasswordPage';
import DashboardRouter from './pages/dashboards/DashboardRouter';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import HrDashboard from './pages/dashboards/HrDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import ProfilePage from './pages/common/ProfilePage';
import PlaceholderModulePage from './pages/common/PlaceholderModulePage';

// Stage 3: Employee Management Pages
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeCreatePage from './pages/employees/EmployeeCreatePage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import EmployeeEditPage from './pages/employees/EmployeeEditPage';

// Stage 4: Department Management Pages
import DepartmentListPage from './pages/departments/DepartmentListPage';
import DepartmentCreatePage from './pages/departments/DepartmentCreatePage';
import DepartmentDetailPage from './pages/departments/DepartmentDetailPage';
import DepartmentEditPage from './pages/departments/DepartmentEditPage';

// Stage 5: Attendance Management Page
import AttendancePage from './pages/attendance/AttendancePage';

// Stage 6: Leave Management Pages
import LeavePage from './pages/leave/LeavePage';
import LeaveApplyPage from './pages/leave/LeaveApplyPage';

// Stage 7: Payroll Management Pages
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollDetailPage from './pages/payroll/PayrollDetailPage';

// Stage 8: Document Management Pages
import DocumentListPage from './pages/documents/DocumentListPage';
import DocumentUploadPage from './pages/documents/DocumentUploadPage';

// Stage 9: Performance Management Pages
import PerformanceDashboardPage from './pages/performance/PerformanceDashboardPage';
import PerformanceCyclesPage from './pages/performance/PerformanceCyclesPage';
import PerformanceGoalsPage from './pages/performance/PerformanceGoalsPage';
import PerformanceReviewsPage from './pages/performance/PerformanceReviewsPage';
import PerformanceReviewDetailPage from './pages/performance/PerformanceReviewDetailPage';

// Stage 10: Recruitment & ATS Pages
import RecruitmentDashboardPage from './pages/recruitment/RecruitmentDashboardPage';
import JobOpeningsPage from './pages/recruitment/JobOpeningsPage';
import JobOpeningCreatePage from './pages/recruitment/JobOpeningCreatePage';
import JobOpeningDetailPage from './pages/recruitment/JobOpeningDetailPage';
import CandidatesPage from './pages/recruitment/CandidatesPage';
import CandidateDetailPage from './pages/recruitment/CandidateDetailPage';
import ApplicationsKanbanPage from './pages/recruitment/ApplicationsKanbanPage';
import ApplicationDetailPage from './pages/recruitment/ApplicationDetailPage';
import InterviewsPage from './pages/recruitment/InterviewsPage';

// Stage 11: Reports, Analytics, Notifications & Audit Logs Pages
import ReportsDashboardPage from './pages/reports/ReportsDashboardPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditLogsPage from './pages/audit/AuditLogsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page: Enterprise Role Selection Portal */}
          <Route path="/" element={<RoleSelectionPortal />} />

          {/* System Health Layout & Integration Monitor */}
          <Route path="/system-health" element={<RootLayout />}>
            <Route index element={<HomePage />} />
          </Route>

          {/* Role-Specific Isolated Login Portals */}
          <Route path="/admin/login" element={<RoleLoginPage role="admin" />} />
          <Route path="/hr/login" element={<RoleLoginPage role="hr" />} />
          <Route path="/manager/login" element={<RoleLoginPage role="manager" />} />
          <Route path="/employee/login" element={<RoleLoginPage role="employee" />} />
          <Route path="/login" element={<RoleLoginPage />} />

          {/* Password Recovery Flows */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Authenticated Dashboard Shell */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Role Dashboard Router */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Role-Specific Isolated Dashboards */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hr', 'admin']}>
                  <HrDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employee', 'admin', 'hr', 'manager']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* STAGE 3: Employee Management Module */}
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <EmployeeCreatePage />
                </ProtectedRoute>
              }
            />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <EmployeeEditPage />
                </ProtectedRoute>
              }
            />

            {/* STAGE 4: Department Management Module */}
            <Route path="/departments" element={<DepartmentListPage />} />
            <Route
              path="/departments/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <DepartmentCreatePage />
                </ProtectedRoute>
              }
            />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route
              path="/departments/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <DepartmentEditPage />
                </ProtectedRoute>
              }
            />

            {/* STAGE 5: Attendance Management Module */}
            <Route path="/attendance" element={<AttendancePage />} />

            {/* STAGE 6: Leave Management Module */}
            <Route path="/leave" element={<LeavePage />} />
            <Route path="/leave/apply" element={<LeaveApplyPage />} />

            {/* STAGE 7: Payroll Management Module */}
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/payroll/:id" element={<PayrollDetailPage />} />

            {/* STAGE 8: Document Management Module */}
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documents/upload" element={<DocumentUploadPage />} />

            {/* Profile Route */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Role-Protected Placeholders for Future Modules (Stage 9+) */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PlaceholderModulePage
                    title="User Account Governance"
                    icon="🔑"
                    stage="Stage 9"
                    features={[
                      'Role provisioning (Admin, HR, Manager, Employee)',
                      'Account locking & deactivation',
                      'Password reset workflow',
                      'Active user sessions & audit logs',
                    ]}
                  />
                </ProtectedRoute>
              }
            />

            {/* STAGE 9: Performance Management Module */}
            <Route path="/performance" element={<PerformanceDashboardPage />} />
            <Route
              path="/performance/cycles"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <PerformanceCyclesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/performance/goals" element={<PerformanceGoalsPage />} />
            <Route path="/performance/reviews" element={<PerformanceReviewsPage />} />
            <Route path="/performance/reviews/:id" element={<PerformanceReviewDetailPage />} />
            <Route path="/performance/:id" element={<PerformanceReviewDetailPage />} />

            {/* STAGE 10: Recruitment & ATS Module */}
            <Route
              path="/recruitment"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <RecruitmentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <JobOpeningsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <JobOpeningCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/jobs/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <JobOpeningDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/candidates"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <CandidatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/candidates/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <CandidateDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/applications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <ApplicationsKanbanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/applications/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <ApplicationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/interviews"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
                  <InterviewsPage />
                </ProtectedRoute>
              }
            />

            <Route path="/reports" element={<ReportsDashboardPage />} />
            <Route path="/reports/*" element={<ReportsDashboardPage />} />
            <Route path="/hr-analytics" element={<ReportsDashboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/system-admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PlaceholderModulePage
                    title="System Administration"
                    icon="⚙️"
                    stage="Stage 10"
                    features={[
                      'System audit logging & security events',
                      'Automated MongoDB Atlas snapshot backups',
                      'API rate limit & CORS management',
                      'Application maintenance mode controls',
                    ]}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <PlaceholderModulePage
                  title="Settings & Preferences"
                  icon="🛠️"
                  stage="Stage 10"
                  features={[
                    'Organization profile & branding',
                    'Email notification delivery settings',
                    'Timezone & date format localization',
                    'Security & session timeout rules',
                  ]}
                />
              }
            />
          </Route>

          {/* Catch-all redirect to Role Selection Portal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
