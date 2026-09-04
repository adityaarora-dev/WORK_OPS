import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, ArrowRight, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { forgotPassword } from '../../services/authService';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage('Please enter your corporate email address or Employee ID.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await forgotPassword(targetEmail);
      setSubmitted(true);
      toast.success(res.message || 'Password reset link sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit reset request. Please try again.';
      setErrorMessage(msg);
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

      {/* Forgot Password Card */}
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
          borderTop: '4px solid var(--primary)',
        }}
      >
        {/* Card Header Icon */}
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
            <KeyRound size={24} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {submitted ? 'Check Your Email' : 'Reset Your Password'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {submitted
              ? 'If an account exists with that email, we have dispatched a secure password reset link.'
              : 'Enter your registered corporate email or Employee ID and we will send you a secure password reset link.'}
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
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
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success State */}
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                  Email Dispatched
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                Please check your inbox (and spam folder) for an email with the subject <em>Reset Your Enterprise HRMS Password</em>. The link will remain active for <strong>15 minutes</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                <span>Return to Role Portal</span>
                <ArrowRight size={14} />
              </Link>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubmitted(false)}
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                }}
              >
                Send Another Link
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label
                htmlFor="forgotEmail"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Corporate Email or Employee ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="forgotEmail"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. employee@company.com or EMP019"
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
                  autoFocus
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
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            >
              <span>{submitting ? 'Sending Reset Link...' : 'Send Password Reset Link'}</span>
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
                Remember your password? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
