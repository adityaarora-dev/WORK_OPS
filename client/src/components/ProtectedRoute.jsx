import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ allowedRoles = null, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-state">
        <div className="loading-spinner"></div>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const hasRole = allowedRoles.map((r) => r.toLowerCase()).includes((user.role || '').toLowerCase());
    if (!hasRole) {
      return (
        <div className="forbidden-card">
          <div className="forbidden-icon">🚫</div>
          <h2>403 — Access Forbidden</h2>
          <p className="forbidden-text">
            Your role (<strong>{user.role?.toUpperCase()}</strong>) does not have authorization to view this resource.
          </p>
          <div className="forbidden-meta">
            Required Role(s): <code>{allowedRoles.join(', ').toUpperCase()}</code>
          </div>
          <div className="forbidden-actions">
            <a href="/dashboard" className="btn-primary">
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
