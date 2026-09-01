import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { testRoleEndpoint } from '../services/authService';

const ROLE_PERMISSIONS = {
  admin: [
    'Full system access',
    'User management',
    'Employee management',
    'Department management',
    'Attendance management',
    'Leave management',
    'Payroll management',
    'Performance management',
    'Reports',
    'System administration',
  ],
  hr: [
    'Employee management',
    'Employee profile management',
    'Attendance management',
    'Leave management',
    'HR reports',
    'Relevant HR operations',
  ],
  manager: [
    'View assigned employees',
    'View team information',
    'View team attendance',
    'Review team leave requests',
    'Approve/reject team leave where permitted',
    'Team reports',
  ],
  employee: [
    'View own profile',
    'View own attendance',
    'Apply for leave',
    'View own leave requests',
    'View own relevant information',
  ],
};

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [testingRole, setTestingRole] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  const permissions = ROLE_PERMISSIONS[user?.role] || [];

  const runTest = async (roleName) => {
    setTestingRole(roleName);
    try {
      const response = await testRoleEndpoint(roleName);
      setTestResults((prev) => ({
        ...prev,
        [roleName]: {
          status: 200,
          success: true,
          message: response.message,
          data: response.data,
          time: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [roleName]: {
          status: err.status || 403,
          success: false,
          message: err.message || 'Access Denied',
          data: err.data || null,
          time: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setTestingRole(null);
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    await Promise.all(['admin', 'hr', 'manager', 'employee'].map(runTest));
    setRunningAll(false);
  };

  return (
    <div className="dashboard-page">
      {/* User Welcome Banner */}
      <section className="user-profile-banner">
        <div className="profile-main">
          <div className="profile-avatar">
            {user?.role === 'admin' && '👑'}
            {user?.role === 'hr' && '💼'}
            {user?.role === 'manager' && '👔'}
            {user?.role === 'employee' && '👤'}
          </div>
          <div className="profile-details">
            <h2>Welcome back, {user?.firstName} {user?.lastName}!</h2>
            <div className="profile-badges">
              <span className={`role-tag role-${user?.role}`}>
                ROLE: {user?.role?.toUpperCase()}
              </span>
              <span className="emp-tag">ID: {user?.employeeId}</span>
              <span className="email-tag">{user?.email}</span>
              <span className="status-tag status-active">● Active</span>
            </div>
          </div>
        </div>
        <button className="btn-secondary logout-btn" onClick={logout}>
          Sign Out
        </button>
      </section>

      {/* Permissions & Capabilities Grid */}
      <div className="dashboard-grid">
        <section className="permissions-card">
          <div className="card-header">
            <h3>📋 Role Capabilities & Permissions</h3>
            <span className="card-sub">{permissions.length} active permissions</span>
          </div>
          <p className="permissions-desc">
            Enforced centrally on the Node.js/Express backend for role <strong>{user?.role?.toUpperCase()}</strong>:
          </p>
          <ul className="permission-list">
            {permissions.map((perm, idx) => (
              <li key={idx} className="permission-item">
                <span className="check-icon">✓</span>
                <span>{perm}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Live Authorization Test Console */}
        <section className="auth-test-card">
          <div className="card-header">
            <h3>🔬 Live Backend Authorization Test Bench</h3>
            <button
              className="btn-primary run-all-btn"
              onClick={runAllTests}
              disabled={runningAll}
            >
              {runningAll ? 'Testing...' : '⚡ Test All Endpoints'}
            </button>
          </div>
          <p className="auth-test-desc">
            Click an endpoint to test real-time backend authorization enforcement using your current JWT:
          </p>

          <div className="endpoint-test-grid">
            {[
              { role: 'admin', label: 'GET /api/test/admin', required: 'Admin only' },
              { role: 'hr', label: 'GET /api/test/hr', required: 'Admin & HR' },
              { role: 'manager', label: 'GET /api/test/manager', required: 'Admin, HR & Manager' },
              { role: 'employee', label: 'GET /api/test/employee', required: 'All Authenticated' },
            ].map(({ role, label, required }) => {
              const res = testResults[role];
              const isLoading = testingRole === role;

              return (
                <div key={role} className="endpoint-item">
                  <div className="endpoint-info">
                    <div className="endpoint-name">
                      <code>{label}</code>
                    </div>
                    <div className="endpoint-req">Access: {required}</div>
                  </div>

                  <div className="endpoint-actions">
                    <button
                      className="test-btn"
                      onClick={() => runTest(role)}
                      disabled={isLoading || runningAll}
                    >
                      {isLoading ? 'Checking...' : 'Execute Test'}
                    </button>

                    {res && (
                      <div
                        className={`status-pill ${
                          res.success ? 'pill-success' : 'pill-forbidden'
                        }`}
                      >
                        {res.success ? `200 OK (Allowed)` : `403 (Forbidden)`}
                      </div>
                    )}
                  </div>

                  {res && (
                    <div className="endpoint-result-details">
                      <div className="result-time">Tested at {res.time}</div>
                      <div className="result-message">{res.message}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
