import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setFormError(result.error);
    }
  };

  const handleQuickFill = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setFormError('');
  };

  if (isAuthenticated && user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-icon">👤</span>
            <h2>Already Logged In</h2>
            <p className="login-sub">
              You are currently authenticated as <strong>{user.firstName} {user.lastName}</strong> ({user.role?.toUpperCase()}).
            </p>
          </div>
          <div className="already-logged-actions">
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="btn-secondary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">🔐</span>
          <h2>System Authentication</h2>
          <p className="login-sub">Sign in to access your HR Management workspace</p>
        </div>

        {formError ? (
          <div className="login-error-alert" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{formError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. hr@hrms.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Test Credential Switcher */}
        <div className="quick-fill-section">
          <div className="quick-fill-title">⚡ Quick-Fill Test Accounts (Stage 2)</div>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="quick-btn badge-admin"
              onClick={() => handleQuickFill('admin@hrms.local', 'Admin@123456')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="quick-btn badge-hr"
              onClick={() => handleQuickFill('hr@hrms.local', 'HrAdmin@1810#')}
            >
              💼 HR
            </button>
            <button
              type="button"
              className="quick-btn badge-manager"
              onClick={() => handleQuickFill('manager@hrms.local', 'Manager@123456')}
            >
              👔 Manager
            </button>
            <button
              type="button"
              className="quick-btn badge-employee"
              onClick={() => handleQuickFill('employee@hrms.local', 'Employee@123456')}
            >
              👤 Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
