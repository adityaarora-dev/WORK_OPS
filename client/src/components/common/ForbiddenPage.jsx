import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ForbiddenPage = ({ requiredRoles = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="forbidden-page-wrapper">
      <div className="forbidden-card">
        <div className="forbidden-icon">🚫</div>
        <div className="forbidden-code">403</div>
        <h2>Access Forbidden</h2>
        <p className="forbidden-text">
          You do not have permission to access this resource. Your account holds role{' '}
          <strong>{user?.role?.toUpperCase() || 'UNKNOWN'}</strong>.
        </p>

        {requiredRoles && requiredRoles.length > 0 && (
          <div className="forbidden-meta">
            Required Permission: <code>{requiredRoles.join(', ').toUpperCase()}</code>
          </div>
        )}

        <div className="forbidden-actions">
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            ← Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
