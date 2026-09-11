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
import ThemeToggle from '../../components/common/ThemeToggle';

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
      iconClass: 'role-icon-gradient-admin',
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
        name: 'Aditya Arora',
        email: 'a4adityaarora@gmail.com',
        empId: 'EMP007',
      },
    },
    {
      id: 'hr',
      title: 'HR',
      badge: 'Workforce Operations',
      cardClass: 'role-card-hr',
      iconClass: 'role-icon-gradient-hr',
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
        name: 'Ashu Kakkar',
        email: 'kakkar.ashu1982@gmail.com',
        empId: 'EMP024',
      },
    },
    {
      id: 'manager',
      title: 'MANAGER',
      badge: 'Team Leadership',
      cardClass: 'role-card-manager',
      iconClass: 'role-icon-gradient-manager',
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
        name: 'Akshat Wadagbalkar',
        email: 'akshat.wadagbalkar@gmail.com',
        empId: 'EMP019',
      },
    },
    {
      id: 'employee',
      title: 'EMPLOYEE',
      badge: 'Self-Service Portal',
      cardClass: 'role-card-employee',
      iconClass: 'role-icon-gradient-employee',
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
        name: 'Anmol Singla (Reports to Akshat)',
        email: 'singlaanmol101@gmail.com',
        empId: 'EMP025',
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
            <div className="portal-brand-sub">Core Platform</div>
          </div>
        </Link>

        <div className="portal-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ThemeToggle />
          {isAuthenticated && user ? (
            <Link
              to={`/${user.role}/dashboard`}
              className="btn btn-primary btn-sm"
              style={{ padding: '7px 16px', borderRadius: '8px' }}
            >
              <span>Go to {user.role?.toUpperCase()} Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <a
              href="#portals"
              className="btn btn-primary btn-sm"
              style={{ padding: '7px 16px', borderRadius: '8px' }}
            >
              <span>Select Portal</span>
              <ArrowRight size={13} />
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="portal-container">
        {/* If user is already authenticated notification */}
        {isAuthenticated && user && (
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '14px',
              marginBottom: '36px',
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
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                  boxShadow: '0 0 8px var(--success)',
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Active session detected for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {user.firstName} {user.lastName}
                </strong>{' '}
                (<code style={{ color: 'var(--primary)', fontWeight: 600 }}>{user.role?.toUpperCase()}</code>).
              </span>
            </div>
            <Link to={`/${user.role}/dashboard`} className="btn btn-primary btn-sm" style={{ padding: '5px 12px' }}>
              <span>Resume Session</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* HERO SECTION: High-Impact Split Grid */}
        <section className="hero-grid-split">
          <div className="hero-left">
            <div className="hero-badge">
              <Lock size={12} style={{ color: 'var(--primary)' }} />
              <span>Enterprise Workspace Gateway</span>
            </div>

            <h1 className="hero-headline">
              Your People.<br />
              <span className="hero-gradient-text">Our Platform.</span>
            </h1>

            <p className="hero-copy">
              One secure workplace for attendance, payroll, recruitment, approvals, and performance. Everything your team needs in one seamless, high-velocity experience.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <a
                href="#portals"
                className="btn btn-primary"
                style={{ padding: '11px 22px', fontSize: '14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Select Your Portal</span>
                <ArrowRight size={15} />
              </a>
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="btn btn-secondary"
                style={{ padding: '11px 20px', fontSize: '14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <KeyRound size={15} />
                <span>Demo Credentials</span>
              </button>
            </div>

            {/* 3 Live Platform Metrics */}
            <div className="hero-metrics-row">
              <div className="hero-metric-card">
                <span className="hero-metric-value">10K+</span>
                <span className="hero-metric-label">Employees Managed</span>
              </div>
              <div className="hero-metric-card">
                <span className="hero-metric-value">99.9%</span>
                <span className="hero-metric-label">Platform Uptime</span>
              </div>
              <div className="hero-metric-card">
                <span className="hero-metric-value">SOC-2</span>
                <span className="hero-metric-label">Enterprise Ready</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Premium Glass Dashboard Illustration */}
          <div className="hero-right">
            <div className="hero-ambient-glow" />

            {/* Top Floating Badge */}
            <div className="hero-floating-card-1">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Live Shift Check-In
              </div>
              <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>Active</span>
            </div>

            {/* Main Glass Mockup Frame */}
            <div className="hero-glass-frame">
              <div className="hero-mockup-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Operations Console
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Live Telemetry
                </span>
              </div>

              {/* Attendance Progress Widget */}
              <div className="hero-mockup-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Shift Attendance Rate</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>98.4%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-default)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: '98.4%', height: '100%', backgroundColor: 'var(--primary)', borderRadius: '999px' }} />
                </div>
              </div>

              {/* Stats Split */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Requisitions</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>14 Roles</div>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Payroll Disbursed</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>$842K</div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="hero-floating-card-2">
              <ShieldCheck size={16} style={{ color: 'var(--role-admin)' }} />
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                RBAC Security Model
              </div>
              <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 700 }}>HS256</span>
            </div>
          </div>
        </section>

        {/* ROLE CARDS SECTION */}
        <section id="portals">
          <div className="role-cards-section-header">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '4px' }}>
                Select Your Workspace Portal
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Isolated operational portals with dedicated governance and role-specific capabilities.
              </p>
            </div>
          </div>

          <div className="role-cards-grid">
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
                    <span className="role-enter-btn">
                      <span>Enter as {r.title}</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
                  <code style={{ fontSize: '11px' }}>EMP007</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>a4adityaarora@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP007#</code></div>
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-hr)' }}>HR Partner (Ashu Kakkar)</strong>
                  <code style={{ fontSize: '11px' }}>EMP024</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>kakkar.ashu1982@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP024#</code></div>
                <Link to="/hr/login" style={{ fontSize: '11.5px', color: 'var(--role-hr)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-hr)' }}>HR Lead (Tanishq Goyal)</strong>
                  <code style={{ fontSize: '11px' }}>EMP023</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>tnu23505@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP023#</code></div>
                <Link to="/hr/login" style={{ fontSize: '11.5px', color: 'var(--role-hr)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-manager)' }}>Manager 1</strong>
                  <code style={{ fontSize: '11px' }}>EMP019</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>akshat.wadagbalkar@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP019#</code></div>
                <Link to="/manager/login" style={{ fontSize: '11.5px', color: 'var(--role-manager)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-manager)' }}>Manager 2</strong>
                  <code style={{ fontSize: '11px' }}>EMP018</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>suvidh.vibrance@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP018#</code></div>
                <Link to="/manager/login" style={{ fontSize: '11.5px', color: 'var(--role-manager)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-employee)' }}>Employee (Reports to Akshat)</strong>
                  <code style={{ fontSize: '11px' }}>EMP025</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>singlaanmol101@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP025#</code></div>
                <Link to="/employee/login" style={{ fontSize: '11.5px', color: 'var(--role-employee)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                  Employee Login →
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-employee)' }}>Employee (Reports to Chiranthan)</strong>
                  <code style={{ fontSize: '11px' }}>EMP021</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>abhiksinha06@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP021#</code></div>
                <Link to="/employee/login" style={{ fontSize: '11.5px', color: 'var(--role-employee)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                  Employee Login →
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
                  <strong style={{ fontSize: '12px', color: 'var(--role-employee)' }}>Employee (Reports to Akshat)</strong>
                  <code style={{ fontSize: '11px' }}>EMP020</code>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>u23022686@gmail.com</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Pass: <code>Corp@EMP020#</code></div>
                <Link to="/employee/login" style={{ fontSize: '11.5px', color: 'var(--role-employee)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
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
