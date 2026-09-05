import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  LogOut,
  Shield,
  CheckCircle2,
  Smartphone,
  Briefcase,
  Users,
  Mail,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { sendLoginOtp, verifyLoginOtp } from '../services/authService';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'otp'

  // Standard Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // OTP Login State (Passwordless via Corporate Email)
  const [otpLoginEmail, setOtpLoginEmail] = useState('');
  const [otpLoginSent, setOtpLoginSent] = useState(false);
  const [otpLoginCode, setOtpLoginCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  const { login, setSession, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // -------------------------------------------------------------
  // 1. Password Login Handler (Invite-Only)
  // -------------------------------------------------------------
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email/ID and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user.firstName}!`);
      navigate(from, { replace: true });
    } else {
      if (result.notFound) {
        setFormError('Access Denied: No active employee account is registered with this email address. Please contact HR.');
      } else {
        setFormError(result.error || 'Authentication failed. Please verify your corporate credentials.');
      }
    }
  };

  // -------------------------------------------------------------
  // 2. Passwordless Corporate OTP Login
  // -------------------------------------------------------------
  const handleSendLoginOtp = async (e) => {
    e?.preventDefault();
    setFormError('');

    if (!otpLoginEmail) {
      setFormError('Please enter your authorized corporate email to receive login OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await sendLoginOtp(otpLoginEmail);
      setOtpLoginSent(true);
      if (res?.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
      }
      toast.success(`Login OTP sent to ${otpLoginEmail}! Please check your email inbox.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch login code.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!otpLoginCode || otpLoginCode.trim().length !== 6) {
      setFormError('Please enter the 6-digit login code sent to your email.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await verifyLoginOtp(otpLoginEmail, otpLoginCode.trim());
      if (res.success && res.data) {
        setSession(res.data.user, res.data.token);
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Invalid or expired login code.');
      toast.error('Verification code invalid or expired.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Quick-fill credentials for the 6 Indian employees
  const handleQuickFill = (userEmail, userPassword) => {
    setActiveTab('password');
    setEmail(userEmail);
    setPassword(userPassword);
    setFormError('');
  };

  if (isAuthenticated && user) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: '440px' }}>
          <div className="login-header">
            <div className="login-brand-icon">
              <User size={22} />
            </div>
            <h2>Session Active</h2>
            <p className="login-sub">
              Logged in as <strong>{user.firstName} {user.lastName}</strong> ({user.role?.toUpperCase()}).
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', padding: '10px' }}
            >
              <span>Continue to Workspace</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={logout}
              style={{ width: '100%', padding: '10px' }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '460px' }}>
        <div className="login-header">
          <div className="login-brand-icon">
            <Building2 size={24} strokeWidth={2.2} />
          </div>
          <h2>HR Management System</h2>
          <p className="login-sub">Enterprise Workforce & Identity Portal</p>
        </div>

        {/* Corporate Invite-Only Policy Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '16px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <ShieldCheck size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
          <span>Restricted Access: Accounts are provisioned exclusively by HR.</span>
        </div>

        {/* Executive Segmented Control Tabs (Password vs Email OTP) */}
        <div className="segmented-tab-bar">
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'password' ? 'tab-active' : ''}`}
            onClick={() => {
              setActiveTab('password');
              setFormError('');
            }}
          >
            <Lock size={13} />
            <span>Password Sign In</span>
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${activeTab === 'otp' ? 'tab-active' : ''}`}
            onClick={() => {
              setActiveTab('otp');
              setFormError('');
            }}
          >
            <Smartphone size={13} />
            <span>Email OTP Sign In</span>
          </button>
        </div>

        {formError && (
          <div className="action-banner banner-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        {/* TAB 1: STANDARD PASSWORD SIGN IN */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="loginEmail">Work Email or Employee ID</label>
              <input
                id="loginEmail"
                type="text"
                placeholder="e.g. a4adityaarora@gmail.com or EMP007"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="loginPassword" style={{ margin: 0 }}>Confidential Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="loginPassword"
                type="password"
                placeholder="Enter your corporate password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={submitting}
            >
              <Lock size={15} />
              <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: PASSWORDLESS OTP LOGIN VIA EMAIL */}
        {activeTab === 'otp' && (
          <div>
            {!otpLoginSent ? (
              <form onSubmit={handleSendLoginOtp} className="login-form">
                <div className="form-group">
                  <label htmlFor="otpLoginEmail">Registered Corporate Email</label>
                  <input
                    id="otpLoginEmail"
                    type="email"
                    placeholder="e.g. tnu23505@gmail.com"
                    value={otpLoginEmail}
                    onChange={(e) => setOtpLoginEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    A one-time 6-digit login code will be emailed directly to your company inbox.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-submit-btn"
                  disabled={otpLoading}
                >
                  <Mail size={15} />
                  <span>{otpLoading ? 'Dispatching Code to Email...' : 'Send Login Code to Email'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyLoginOtp} className="login-form">
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-subtle)',
                      color: 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Login Code Dispatched
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                    Enter the 6-digit code sent to <strong>{otpLoginEmail}</strong>.
                  </div>

                  {emailPreviewUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href={emailPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '4px',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Open Live Test Inbox (View Code Online)</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="otpLoginCode">Enter 6-Digit Email Code</label>
                  <input
                    id="otpLoginCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpLoginCode}
                    onChange={(e) => setOtpLoginCode(e.target.value)}
                    style={{
                      textAlign: 'center',
                      fontSize: '22px',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.25em',
                      fontWeight: 700,
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setOtpLoginSent(false)}
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={otpLoading}
                    style={{ flex: 2 }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{otpLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleSendLoginOtp}
                    disabled={otpLoading}
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <RotateCcw size={12} />
                    <span>Resend Code to Email</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Verified Corporate Accounts Quick Fill (Only fills credentials for the 6 Real Accounts) */}
        <div className="quick-fill-section">
          <div className="quick-fill-title">Authorized Corporate Accounts (6 Verified Profiles)</div>
          <div className="quick-fill-grid">
            <button
              type="button"
              className="quick-btn"
              onClick={() => handleQuickFill('a4adityaarora@gmail.com', 'Corp@EMP007#')}
              title="Chief Technology Officer & Director"
            >
              <Shield size={13} style={{ color: '#7c3aed' }} />
              <span>Aditya A. (Admin)</span>
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() => handleQuickFill('tnu23505@gmail.com', 'Corp@EMP023#')}
              title="Head of People Operations"
            >
              <Briefcase size={13} style={{ color: '#2563eb' }} />
              <span>Tanishq G. (HR Lead)</span>
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() => handleQuickFill('akshat.wadagbalkar@gmail.com', 'Corp@EMP019#')}
              title="Cloud & Infrastructure Engineering Manager"
            >
              <Users size={13} style={{ color: '#0d9488' }} />
              <span>Akshat W. (Manager 1)</span>
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() => handleQuickFill('suvidh.vibrance@gmail.com', 'Corp@EMP018#')}
              title="Software Development Engineering Manager"
            >
              <Users size={13} style={{ color: '#0d9488' }} />
              <span>Chiranthan S. (Manager 2)</span>
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() => handleQuickFill('abhiksinha06@gmail.com', 'Corp@EMP021#')}
              title="Backend Software Engineer (Reports to Chiranthan)"
            >
              <User size={13} style={{ color: '#475569' }} />
              <span>Abhik S. (Dev)</span>
            </button>

            <button
              type="button"
              className="quick-btn"
              onClick={() => handleQuickFill('u23022686@gmail.com', 'Corp@EMP020#')}
              title="AI & Cloud Engineer (Reports to Akshat)"
            >
              <User size={13} style={{ color: '#475569' }} />
              <span>Uttkarsh K. (AI Eng)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password OTP Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email || otpLoginEmail}
      />
    </div>
  );
};

export default LoginPage;
