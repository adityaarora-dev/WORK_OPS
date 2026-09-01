import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardRouter from './pages/dashboards/DashboardRouter';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeCreatePage from './pages/employees/EmployeeCreatePage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import EmployeeEditPage from './pages/employees/EmployeeEditPage';
import ProfilePage from './pages/common/ProfilePage';
import PlaceholderModulePage from './pages/common/PlaceholderModulePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Stage 1 System Health Layout */}
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
          </Route>

          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Dashboard Shell */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Role Dashboard */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Employee Management Module */}
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

            {/* Profile Route */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Role-Protected Placeholders for Permitted Navigation */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PlaceholderModulePage
                    title="User Management"
                    icon="🔑"
                    stage="Stage 4"
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

            <Route
              path="/departments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <PlaceholderModulePage
                    title="Departments"
                    icon="🏢"
                    stage="Stage 4"
                    features={[
                      'Department hierarchy management',
                      'Department head assignment',
                      'Budget & cost center tracking',
                      'Workforce headcount allocation',
                    ]}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/attendance"
              element={
                <PlaceholderModulePage
                  title="Attendance & Timesheets"
                  icon="⏱️"
                  stage="Stage 4"
                  features={[
                    'Daily clock-in & clock-out recording',
                    'Biometric device integration',
                    'Overtime tracking & calculation',
                    'Manager approval workflows',
                  ]}
                />
              }
            />

            <Route
              path="/leave"
              element={
                <PlaceholderModulePage
                  title="Leave Management"
                  icon="📅"
                  stage="Stage 4"
                  features={[
                    'Paid time-off (PTO) application',
                    'Leave balance calculations',
                    'Multi-tier manager & HR approvals',
                    'Company holiday calendar synchronization',
                  ]}
                />
              }
            />

            <Route
              path="/payroll"
              element={
                <PlaceholderModulePage
                  title="Payroll & Compensation"
                  icon="💵"
                  stage="Stage 5"
                  features={[
                    'Automated salary computation',
                    'Tax & statutory deduction engine',
                    'Paystub generation & PDF downloads',
                    'Direct bank deposit file generation',
                  ]}
                />
              }
            />

            <Route
              path="/performance"
              element={
                <PlaceholderModulePage
                  title="Performance & Appraisals"
                  icon="📈"
                  stage="Stage 5"
                  features={[
                    'Quarterly OKR & goal setting',
                    '360-degree peer feedback',
                    'Performance appraisal scorecards',
                    'Promotion & compensation adjustment tracking',
                  ]}
                />
              }
            />

            <Route
              path="/recruitment"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PlaceholderModulePage
                    title="Recruitment & ATS"
                    icon="🎯"
                    stage="Stage 6"
                    features={[
                      'Job opening requisitions',
                      'Candidate Kanban pipeline',
                      'Interview schedule coordination',
                      'Automated offer letter generation',
                    ]}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <PlaceholderModulePage
                  title="Reports & Analytics"
                  icon="📑"
                  stage="Stage 5"
                  features={[
                    'Headcount growth & turnover analytics',
                    'Department salary expenditure breakdowns',
                    'Attendance compliance summaries',
                    'CSV and PDF data exports',
                  ]}
                />
              }
            />

            <Route
              path="/hr-analytics"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <PlaceholderModulePage
                    title="HR Analytics"
                    icon="📊"
                    stage="Stage 5"
                    features={[
                      'Workforce demographics & diversity',
                      'Time-to-hire velocity tracking',
                      'Absenteeism & sick leave patterns',
                      'Employee retention heatmaps',
                    ]}
                  />
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
                    stage="Stage 6"
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
                  stage="Stage 6"
                  features={[
                    'Organization profile & branding',
                    'Email notification delivery settings',
                    'Timezone & date format localization',
                    'Security & session timeout rules',
                  ]}
                />
              }
            />

            <Route
              path="/documents"
              element={
                <PlaceholderModulePage
                  title="Document Center"
                  icon="📁"
                  stage="Stage 5"
                  features={[
                    'Signed employment contracts & NDAs',
                    'Company policy handbook access',
                    'Tax & identity verification uploads',
                    'Secure encrypted document storage',
                  ]}
                />
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
