import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ForbiddenPage = ({ requiredRoles = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="form-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          padding: '36px 24px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-subtle)',
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={26} />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--danger)',
            letterSpacing: '0.05em',
            marginBottom: '4px',
          }}
        >
          HTTP 403 ACCESS RESTRICTED
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          Clearance Level Insufficient
        </h2>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
          Your current account clearance level is{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{user?.role?.toUpperCase()}</strong>. You
          do not have administrative clearance to access this module.
        </p>

        {requiredRoles && requiredRoles.length > 0 && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
            }}
          >
            Authorized Roles: <span className="code-pill">{requiredRoles.join(', ').toUpperCase()}</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%' }}
        >
          <ArrowLeft size={15} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
