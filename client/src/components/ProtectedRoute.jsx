import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ allowedRoles = null, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="loading-spinner"></div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    let targetLogin = '/';
    const path = location.pathname;
    if (path.startsWith('/admin')) targetLogin = '/admin/login';
    else if (path.startsWith('/hr')) targetLogin = '/hr/login';
    else if (path.startsWith('/manager')) targetLogin = '/manager/login';
    else if (path.startsWith('/employee')) targetLogin = '/employee/login';

    return <Navigate to={targetLogin} state={{ from: location }} replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = (user?.role || '').toLowerCase();
    const hasRole = allowedRoles.map((r) => r.toLowerCase()).includes(userRole);
    if (!hasRole) {
      const dashboardTarget = `/${userRole}/dashboard`;
      return (
        <div className="forbidden-card" style={{ maxWidth: '520px', margin: '60px auto', padding: '36px 28px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldAlert size={26} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p className="forbidden-text" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Your account role (<strong>{user?.role?.toUpperCase()}</strong>) does not possess clearance to view this module.
          </p>
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '8px', border: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Authorized Role(s): <code>{allowedRoles.join(', ').toUpperCase()}</code>
          </div>
          <div className="forbidden-actions">
            <Link to={dashboardTarget} className="btn btn-primary">
              <ArrowLeft size={14} />
              <span>Return to My Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
