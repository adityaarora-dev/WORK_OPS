import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Mail,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { forgotPassword, verifyResetOtp } from '../../services/authService';

export const ForgotPasswordPage = () => {
  // Steps: 'email' | 'otp' | 'success'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 6 OTP boxes state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // 60-second countdown timer for resend
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Result URL from OTP verification
  const [resetUrl, setResetUrl] = useState('');

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Auto-focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // 1. Submit email request
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage('Please enter your corporate email address or Employee ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(targetEmail);
      setStep('otp');
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      toast.success(res.message || '6-digit verification code sent to your email.');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit reset request. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Resend OTP handler
  const handleResend = async () => {
    if (!canResend || loading) return;
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
      toast.success(res.message || 'A new 6-digit code has been dispatched.');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to resend code. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. OTP inputs & paste handler
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const lastDigit = cleanVal.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = lastDigit;
    setOtp(newOtp);

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const currentCode = newOtp.join('');
    if (currentCode.length === 6 && !newOtp.includes('')) {
      handleOtpSubmit(currentCode);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[focusIndex]?.focus();

    if (pasted.length === 6) {
      handleOtpSubmit(pasted);
    }
  };

  // 4. Verify OTP & Open New Tab
  const handleOtpSubmit = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const res = await verifyResetOtp(email.trim(), code);
      if (res.success && res.resetUrl) {
        setResetUrl(res.resetUrl);
        setStep('success');
        toast.success('Verification successful! Opening reset page in a new tab.');

        // Automatically open new tab pointing to Reset Password page
        try {
          const newTab = window.open(res.resetUrl, '_blank', 'noopener,noreferrer');
          if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
            console.warn('[AUTH] Popup blocked by browser. User will use manual link.');
          }
        } catch (popupErr) {
          console.warn('[AUTH] Error opening new tab:', popupErr.message);
        }
      } else {
        setErrorMessage(res.message || 'OTP verification failed.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Code may be invalid or expired.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualOpenTab = () => {
    if (resetUrl) {
      window.open(resetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
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
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '18px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--primary)',
        }}
      >
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

        {/* ========================================================= */}
        {/* STEP 1: EMAIL ENTRY                                       */}
        {/* ========================================================= */}
        {step === 'email' && (
          <div>
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
                Reset Your Password
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Enter your registered corporate email or Employee ID and we will dispatch a secure 6-digit OTP code.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit}>
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
                    placeholder="e.g. a4adityaarora@gmail.com or EMP007"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
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
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="spin-animation" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send 6-Digit OTP</span>
                    <ArrowRight size={14} />
                  </>
                )}
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
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: OTP VERIFICATION                                  */}
        {/* ========================================================= */}
        {step === 'otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                  margin: '0 auto 12px',
                }}
              >
                <Mail size={24} />
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Enter 6-Digit OTP
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
            </div>

            {/* 6 Individual OTP Boxes */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '52px',
                    fontSize: '20px',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono, monospace)',
                    borderRadius: '10px',
                    border: digit
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border-default)',
                    backgroundColor: digit ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 150ms ease',
                    boxShadow: digit ? 'var(--shadow-xs)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Timer & Change Email */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '22px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12px',
                  textDecoration: 'underline',
                }}
              >
                Change Email
              </button>

              <div>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary, #0B2447)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Resend OTP Code</span>
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Resend code in <strong style={{ color: 'var(--text-primary)' }}>{timer}s</strong>
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOtpSubmit()}
              disabled={loading || otp.join('').length !== 6}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="spin-animation" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Reset Password</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SUCCESS & NEW TAB NOTIFICATION                    */}
        {/* ========================================================= */}
        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={28} />
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              OTP Verified Successfully
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              A new browser tab has been launched pointing to your secure Reset Password page.
              Please complete setting your new password there.
            </p>

            <div
              style={{
                padding: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Didn't see the new tab open?
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                If your browser blocked the popup, click the button below to open the Reset Password page manually:
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleManualOpenTab}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--primary)',
                }}
              >
                <ExternalLink size={13} />
                <span>Open Reset Password Page ↗</span>
              </button>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
