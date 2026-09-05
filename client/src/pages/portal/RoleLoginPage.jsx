import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Briefcase,
  User,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { sendLoginOtp, verifyLoginOtp } from '../../services/authService';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

const ROLE_CONFIGS = {
  admin: {
    roleId: 'admin',
    title: 'Admin Login',
    badge: 'Executive Governance',
    subtitle: 'Sign in to access system administration, audit logs, and security governance.',
    accentColor: '#0A2947',
    icon: ShieldCheck,
    topBorder: '4px solid #0A2947',
    dashboardPath: '/admin/dashboard',
    defaultEmail: 'a4adityaarora@gmail.com',
    defaultPass: 'Corp@EMP007#',
    empName: 'Aditya Arora',
    empId: 'EMP007',
    roleTag: 'ADMINISTRATOR',
  },
  hr: {
    roleId: 'hr',
    title: 'HR Login',
    badge: 'Human Resources',
    subtitle: 'Sign in to manage employee directory, recruitment, attendance, and payroll.',
    accentColor: '#8B5E3C',
    icon: Users,
    topBorder: '4px solid #8B5E3C',
    dashboardPath: '/hr/dashboard',
    defaultEmail: 'tnu23505@gmail.com',
    defaultPass: 'Corp@EMP023#',
    empName: 'Tanishq Goyal',
    empId: 'EMP023',
    roleTag: 'HR ADMIN',
  },
  manager: {
    roleId: 'manager',
    title: 'Manager Login',
    badge: 'Team Leadership',
    subtitle: 'Sign in to review direct reports, approve leaves, and oversee team performance.',
    accentColor: '#556B2F',
    icon: Briefcase,
    topBorder: '4px solid #556B2F',
    dashboardPath: '/manager/dashboard',
    defaultEmail: 'akshat.wadagbalkar@gmail.com',
    defaultPass: 'Corp@EMP019#',
    empName: 'Akshat Wadagbalkar',
    empId: 'EMP019',
    roleTag: 'TEAM MANAGER',
  },
  employee: {
    roleId: 'employee',
    title: 'Employee Login',
    badge: 'Self-Service',
    subtitle: 'Sign in to check in attendance, apply for leaves, and download paystubs.',
    accentColor: '#2563eb',
    icon: User,
    topBorder: '4px solid #2563eb',
    dashboardPath: '/employee/dashboard',
    defaultEmail: 'abhiksinha06@gmail.com',
    defaultPass: 'Corp@EMP021#',
    empName: 'Abhik Sinha',
    empId: 'EMP021',
    roleTag: 'EMPLOYEE',
  },
};

export const RoleLoginPage = ({ role: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, setSession, isAuthenticated, user, logout } = useAuth();

  // Determine active role from prop or route path
  const path = location.pathname.toLowerCase();
  let activeRoleId = propRole;
  if (!activeRoleId) {
    if (path.includes('/admin')) activeRoleId = 'admin';
    else if (path.includes('/hr')) activeRoleId = 'hr';
    else if (path.includes('/manager')) activeRoleId = 'manager';
    else activeRoleId = 'employee';
  }

  const roleConfig = ROLE_CONFIGS[activeRoleId] || ROLE_CONFIGS.employee;
  const IconComponent = roleConfig.icon;

  // Form tabs: 'password' or 'otp'
  const [activeTab, setActiveTab] = useState('password');

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // OTP Login State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const from = location.state?.from?.pathname;

  // Quick fill demo credentials
  const handleQuickFill = () => {
    setEmail(roleConfig.defaultEmail);
    setPassword(roleConfig.defaultPass);
    setFormError('');
  };

  // Password Login Handler
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please provide both your corporate identifier and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      const loggedUser = result.user;
      const loggedRole = (loggedUser?.role || 'employee').toLowerCase();
      toast.success(`Welcome back, ${loggedUser.firstName}!`);

      // If user came from a protected route and has authorization for it, return there
      if (from && from !== '/' && !from.includes('/login')) {
        navigate(from, { replace: true });
        return;
      }

      // Otherwise, navigate to the user's appropriate role dashboard
      navigate(`/${loggedRole}/dashboard`, { replace: true });
    } else {
      setFormError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  // OTP Login Handlers
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setFormError('');

    if (!otpEmail) {
      setFormError('Please enter your authorized corporate email to receive an OTP code.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await sendLoginOtp(otpEmail.trim());
      setOtpSent(true);
      if (res?.previewUrl) setPreviewUrl(res.previewUrl);
      toast.success(`6-digit code dispatched to ${otpEmail}!`);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to dispatch code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setFormError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await verifyLoginOtp(otpEmail.trim(), otpCode.trim());
      if (res.success && res.data) {
        setSession(res.data.user, res.data.token);
        const loggedRole = (res.data.user.role || 'employee').toLowerCase();
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
        navigate(`/${loggedRole}/dashboard`, { replace: true });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Invalid code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // If already logged in
  if (isAuthenticated && user) {
    const currentRole = (user.role || 'employee').toLowerCase();
    return (
      <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="login-card" style={{ maxWidth: '460px', width: '100%', borderTop: roleConfig.topBorder }}>
          <div className="login-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="brand-logo" style={{ margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Active Session Detected</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              You are currently authenticated as <strong>{user.firstName} {user.lastName}</strong> ({user.role?.toUpperCase()}).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to={`/${currentRole}/dashboard`} className="btn btn-primary" style={{ width: '100%' }}>
              <span>Continue to {user.role?.toUpperCase()} Dashboard</span>
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                await logout();
                setEmail('');
                setPassword('');
              }}
              style={{ width: '100%' }}
            >
              Sign Out & Switch User
            </button>
            <Link to="/" style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
              ← Return to Role Selection Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Return to Portal Link */}
      <div style={{ width: '100%', maxWidth: '440px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          <span>Role Selection Portal</span>
        </Link>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          VTOP Secure Gateway
        </span>
      </div>

      {/* Main Login Card with Thin Colored Top Border */}
      <div
        className="login-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '32px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-default)',
          borderTop: roleConfig.topBorder,
        }}
      >
        {/* Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              color: roleConfig.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <IconComponent size={24} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'var(--bg-surface-subtle)', fontSize: '11px', fontWeight: 600, color: roleConfig.accentColor, marginBottom: '6px' }}>
            <span>{roleConfig.badge}</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {roleConfig.title}
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {roleConfig.subtitle}
          </p>
        </div>

        {/* Quick Autofill Demo Pill */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: '10px',
            border: '1px solid var(--border-default)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Demo Account:</div>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {roleConfig.empName} ({roleConfig.empId})
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleQuickFill}
            style={{ fontSize: '11.5px', padding: '4px 10px' }}
          >
            <KeyRound size={12} />
            <span>Autofill</span>
          </button>
        </div>

        {/* Auth Method Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            padding: '4px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setFormError('');
            }}
            style={{
              padding: '7px 12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'password' ? '#ffffff' : 'transparent',
              color: activeTab === 'password' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'password' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 220ms ease',
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('otp');
              setFormError('');
              setOtpEmail(email || roleConfig.defaultEmail);
            }}
            style={{
              padding: '7px 12px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'otp' ? '#ffffff' : 'transparent',
              color: activeTab === 'otp' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'otp' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 220ms ease',
            }}
          >
            Email OTP
          </button>
        </div>

        {/* Error Notification */}
        {formError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid var(--danger-border)',
              borderRadius: '8px',
              color: 'var(--danger-text)',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{formError}</span>
          </div>
        )}

        {/* Password Form */}
        {activeTab === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="roleEmail" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Corporate Email or ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="roleEmail"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`e.g. ${roleConfig.defaultEmail} or ${roleConfig.empId}`}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="rolePassword" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    color: roleConfig.accentColor === '#0A2947' ? 'var(--primary)' : roleConfig.accentColor,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="rolePassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your corporate password"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                backgroundColor: roleConfig.accentColor === '#0A2947' ? 'var(--primary)' : roleConfig.accentColor,
                borderColor: roleConfig.accentColor,
              }}
            >
              <span>{submitting ? 'Verifying Credentials...' : `Sign in as ${roleConfig.title.replace(' Login', '')}`}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          /* OTP Form */
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label htmlFor="otpEmailInput" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Corporate Email
                  </label>
                  <input
                    id="otpEmailInput"
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder={roleConfig.defaultEmail}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={otpLoading}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    backgroundColor: roleConfig.accentColor,
                    borderColor: roleConfig.accentColor,
                  }}
                >
                  <span>{otpLoading ? 'Dispatching...' : 'Send Verification OTP'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Enter the 6-digit verification code sent to <strong>{otpEmail}</strong>:
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    style={{
                      width: '100%',
                      padding: '10px',
                      textAlign: 'center',
                      fontSize: '22px',
                      letterSpacing: '0.3em',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                {previewUrl && (
                  <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11.5px', color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                      View Simulated Ethereal Email Preview ↗
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={otpLoading}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    backgroundColor: roleConfig.accentColor,
                    borderColor: roleConfig.accentColor,
                  }}
                >
                  <span>{otpLoading ? 'Verifying...' : 'Authenticate & Enter'}</span>
                  <CheckCircle2 size={14} />
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}
                  >
                    Resend Code or Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Switch Role Quick Links */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-default)', textAlign: 'center' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Switch to a different operational role:
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {Object.keys(ROLE_CONFIGS).map((rid) => {
              if (rid === activeRoleId) return null;
              const r = ROLE_CONFIGS[rid];
              return (
                <Link
                  key={rid}
                  to={`/${rid}/login`}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: r.accentColor,
                    textDecoration: 'none',
                  }}
                >
                  {r.title.replace(' Login', '')} →
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forgot Password OTP Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email || roleConfig.defaultEmail}
      />
    </div>
  );
};

export default RoleLoginPage;
