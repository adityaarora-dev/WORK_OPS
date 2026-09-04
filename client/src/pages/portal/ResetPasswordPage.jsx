import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { verifyResetToken, resetPassword } from '../../services/authService';

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // Verification state: 'checking' | 'valid' | 'invalid'
  const [tokenStatus, setTokenStatus] = useState('checking');
  const [tokenError, setTokenError] = useState('');
  const [associatedEmail, setAssociatedEmail] = useState('');

  // Form inputs
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      if (!token) {
        setTokenStatus('invalid');
        setTokenError('No reset token provided.');
        return;
      }

      try {
        const res = await verifyResetToken(token);
        if (isMounted) {
          setTokenStatus('valid');
          setAssociatedEmail(res.email || '');
        }
      } catch (err) {
        if (isMounted) {
          setTokenStatus('invalid');
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Password reset link is invalid or has expired.';
          setTokenError(msg);
        }
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Submit new password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!password) {
      setFormError('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-type and confirm.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(token, password, confirmPassword);
      setSuccess(true);
      toast.success(res.message || 'Password reset successfully!');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to reset password. The link may have expired.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Top Header Navigation */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
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
          <span>Back to Portal</span>
        </Link>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Identity & Security
        </span>
      </div>

      {/* Main Card */}
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '36px 32px',
          boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
          border: '1px solid var(--border-default)',
          borderTop: '4px solid var(--primary, #0B2447)',
        }}
      >
        {/* Token Verification in Progress */}
        {tokenStatus === 'checking' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-subtle, #f0f4f8)',
                color: 'var(--primary, #0B2447)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <RefreshCw size={24} className="spin-animation" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Validating Security Token...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Verifying your one-time password reset link.
            </p>
          </div>
        )}

        {/* Token Invalid or Expired */}
        {tokenStatus === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={24} />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Reset Link Expired or Invalid
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              {tokenError || 'This password reset link is invalid, has already been used, or has expired after 15 minutes.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/forgot-password"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                <span>Request New Reset Link</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  fontSize: '12.5px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}

        {/* Password Reset Success */}
        {tokenStatus === 'valid' && success && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={26} />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Password Updated Successfully
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              Your account password has been reset. You can now sign in using your new credentials.
            </p>

            <Link
              to="/"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              <span>Sign In to Your Account</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Valid Token -> Reset Password Form */}
        {tokenStatus === 'valid' && !success && (
          <div>
            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-subtle, #f0f4f8)',
                  border: '1px solid var(--primary-border, #ccd8e4)',
                  color: 'var(--primary, #0B2447)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <Lock size={24} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Set New Password
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {associatedEmail
                  ? `Choose a secure new password for ${associatedEmail}.`
                  : 'Enter your new password below.'}
              </p>
            </div>

            {/* Error Banner */}
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--danger-subtle, #fef2f2)',
                  border: '1px solid var(--danger-border, #fecaca)',
                  borderRadius: '10px',
                  color: 'var(--danger-text, #991b1b)',
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

            <form onSubmit={handleResetSubmit}>
              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="newPassword"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 14px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                <span>{submitting ? 'Updating Password...' : 'Save New Password'}</span>
                <ArrowRight size={14} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link
                  to="/"
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Cancel and <span style={{ color: 'var(--primary)', fontWeight: 600 }}>return to login</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
