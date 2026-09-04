import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Briefcase,
  User,
  ArrowRight,
  Building2,
  Activity,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const RoleSelectionPortal = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const roles = [
    {
      id: 'admin',
      title: 'ADMIN',
      badge: 'Executive Governance',
      cardClass: 'role-card-admin',
      iconClass: 'role-icon-admin',
      badgeClass: 'badge-admin-portal',
      icon: ShieldCheck,
      description: 'Complete organizational control with workforce oversight.',
      path: '/admin/login',
      features: [
        'User Account Governance',
        'Department Hierarchy',
        'Security & Access Audits',
        'Executive Workforce Intelligence',
      ],
      demoAccount: {
        name: 'Aarav Sharma',
        email: 'aarav.sharma@company.com',
        empId: 'EMP001',
      },
    },
    {
      id: 'hr',
      title: 'HR',
      badge: 'Workforce Operations',
      cardClass: 'role-card-hr',
      iconClass: 'role-icon-hr',
      badgeClass: 'badge-hr-portal',
      icon: Users,
      description: 'Hire, manage, and empower employees efficiently.',
      path: '/hr/login',
      features: [
        'Employee Master Directory',
        'Recruitment ATS & Pipeline',
        'Time & Leave Administration',
        'Payroll Processing & Vouchers',
      ],
      demoAccount: {
        name: 'Priya Patel',
        email: 'priya.patel@company.com',
        empId: 'EMP002',
      },
    },
    {
      id: 'manager',
      title: 'MANAGER',
      badge: 'Team Leadership',
      cardClass: 'role-card-manager',
      iconClass: 'role-icon-manager',
      badgeClass: 'badge-manager-portal',
      icon: Briefcase,
      description: 'Lead teams with smarter approvals and performance tracking.',
      path: '/manager/login',
      features: [
        'Direct Report Oversight',
        'Leave Approvals & Scheduling',
        'Team Attendance Monitoring',
        'Performance Appraisals & OKRs',
      ],
      demoAccount: {
        name: 'Rajesh Iyer',
        email: 'rajesh.iyer@company.com',
        empId: 'EMP003',
      },
    },
    {
      id: 'employee',
      title: 'EMPLOYEE',
      badge: 'Self-Service Portal',
      cardClass: 'role-card-employee',
      iconClass: 'role-icon-employee',
      badgeClass: 'badge-employee-portal',
      icon: User,
      description: 'Access everything you need in one secure workspace.',
      path: '/employee/login',
      features: [
        '1-Click Shift Check-In',
        'Leave Applications & Balances',
        'Digital Monthly Paystubs',
        'Personal Document Vault',
      ],
      demoAccount: {
        name: 'Akshat Wadagbalkar',
        email: 'akshat.wadagbalkar@gmail.com',
        empId: 'EMP019',
      },
    },
  ];

  return (
    <div className="portal-wrapper">
      {/* Top Navbar */}
      <header className="portal-navbar">
        <Link to="/" className="portal-brand">
          <div className="portal-brand-logo">
            <Building2 size={20} />
          </div>
          <div>
            <div className="portal-brand-title">Enterprise HRMS</div>
          </div>
        </Link>

        <div className="portal-nav-links">
          {isAuthenticated && user && (
            <Link
              to={`/${user.role}/dashboard`}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px' }}
            >
              <span>Go to {user.role?.toUpperCase()} Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Role Selection View */}
      <main className="portal-container">
        {/* If user is already authenticated */}
        {isAuthenticated && user && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-xs)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                }}
              />
              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                You are currently signed in as{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {user.firstName} {user.lastName}
                </strong>{' '}
                (<code style={{ color: 'var(--primary)', fontWeight: 600 }}>{user.role?.toUpperCase()}</code>).
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to={`/${user.role}/dashboard`} className="btn btn-primary btn-sm">
                <span>Resume Session</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="portal-hero">
          <div className="portal-hero-badge">
            <Lock size={12} style={{ color: 'var(--primary)' }} />
            <span>Enterprise Workspace Gateway</span>
          </div>
          <h1 className="portal-hero-title">Select Your Workspace Portal</h1>
          <p className="portal-hero-desc">
            One secure workplace. Everything your team needs—from attendance and leave management to payroll, approvals, and performance—all in one seamless experience.
          </p>
        </section>

        {/* 4 Elegant Role Cards */}
        <section className="role-cards-grid">
          {roles.map((r) => {
            const IconComponent = r.icon;
            return (
              <div
                key={r.id}
                className={`role-portal-card ${r.cardClass}`}
                onClick={() => navigate(r.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(r.path);
                  }
                }}
              >
                <div>
                  <div className={`role-card-icon-box ${r.iconClass}`}>
                    <IconComponent size={24} />
                  </div>

                  <div className="role-card-title">
                    <span>{r.title}</span>
                    <span className={`role-card-badge ${r.badgeClass}`}>{r.badge}</span>
                  </div>

                  <p className="role-card-desc">{r.description}</p>

                  <ul className="role-card-features">
                    {r.features.map((feat, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={13} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="role-card-footer">
                  <span className="role-card-btn">
                    <span>Enter as {r.title}</span>
                    <ArrowRight size={14} />
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
                    {r.demoAccount.empId}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick Credentials Accordion */}
        <section className="portal-demo-banner">
          <div className="portal-demo-info">
            <div className="portal-demo-icon">
              <KeyRound size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'block' }}>
                Pre-Configured Role Credentials
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Instant access credentials for verifying each isolated role workflow.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowDemoCredentials(!showDemoCredentials)}
          >
            <span>{showDemoCredentials ? 'Hide Credentials' : 'Show Credentials'}</span>
            {showDemoCredentials ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDemoCredentials && (
            <div
              style={{
                width: '100%',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-default)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--primary)' }}>Admin (Executive)</strong>
                  <code style={{ fontSize: '11px' }}>EMP001</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>aarav.sharma@company.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Admin@123456</code></div>
                <Link to="/admin/login" style={{ fontSize: '11.5px', color: 'var(--primary)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                  Admin Login →
                </Link>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--brown)' }}>HR Administrator</strong>
                  <code style={{ fontSize: '11px' }}>EMP002</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>priya.patel@company.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>HrAdmin@1810#</code></div>
                <Link to="/hr/login" style={{ fontSize: '11.5px', color: 'var(--brown)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                  HR Login →
                </Link>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#3b4e1e' }}>Team Manager</strong>
                  <code style={{ fontSize: '11px' }}>EMP003</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>rajesh.iyer@company.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Manager@123456</code></div>
                <Link to="/manager/login" style={{ fontSize: '11.5px', color: '#3b4e1e', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                  Manager Login →
                </Link>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#1d4ed8' }}>Employee</strong>
                  <code style={{ fontSize: '11px' }}>EMP019</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>akshat.wadagbalkar@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP019#</code></div>
                <Link to="/employee/login" style={{ fontSize: '11.5px', color: '#1d4ed8', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                  Employee Login →
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Footer */}
      <footer className="portal-footer">
        <div>
          <span>Enterprise HR Management System &copy; {new Date().getFullYear()} • Secure Corporate Portal</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>AES-256 & JWT Protected</span>
        </div>
      </footer>
    </div>
  );
};

export default RoleSelectionPortal;
