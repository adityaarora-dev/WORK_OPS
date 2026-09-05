import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Mail,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { forgotPassword, verifyResetOtp } from '../../services/authService';

export const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
  // Modal Steps: 'email' | 'otp' | 'success'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP 6-box state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // Resend countdown timer (60s)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Result from backend on OTP verification
  const [resetUrl, setResetUrl] = useState('');

  // Synchronize initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setStep('email');
      setError('');
      setOtp(['', '', '', '', '', '']);
      setResetUrl('');
      setTimer(60);
      setCanResend(false);
    }
  }, [isOpen, initialEmail]);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (isOpen && step === 'otp' && timer > 0) {
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
  }, [isOpen, step, timer]);

  // Auto-focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // 1. Dispatch OTP to corporate email
  // -------------------------------------------------------------
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Please provide your corporate email or Employee ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(targetEmail);
      setStep('otp');
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      toast.success(res.message || '6-digit verification code dispatched.');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to dispatch reset code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Resend OTP handler
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
      toast.success(res.message || 'A fresh 6-digit code has been sent.');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. OTP individual box inputs & paste handling
  // -------------------------------------------------------------
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

    // Auto-advance to next input
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // If all 6 boxes are filled, automatically trigger submission
    const currentCode = newOtp.join('');
    if (currentCode.length === 6 && !newOtp.includes('')) {
      submitOtpVerification(currentCode);
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
      submitOtpVerification(pasted);
    }
  };

  // -------------------------------------------------------------
  // 4. Verify OTP & Open New Tab
  // -------------------------------------------------------------
  const submitOtpVerification = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await verifyResetOtp(email.trim(), code);
      if (res.success && res.resetUrl) {
        setResetUrl(res.resetUrl);
        setStep('success');
        toast.success('Verification successful! Opening reset page in a new tab.');

        // Automatically open new tab pointing to Reset Password page
        try {
          const openedTab = window.open(res.resetUrl, '_blank', 'noopener,noreferrer');
          if (!openedTab || openedTab.closed || typeof openedTab.closed === 'undefined') {
            console.warn('[AUTH] Popup blocked by browser policy. Providing manual button.');
          }
        } catch (popupErr) {
          console.warn('[AUTH] Error opening new tab:', popupErr.message);
        }
      } else {
        setError(res.message || 'OTP verification failed. Please check the code.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Code may be invalid or expired.';
      setError(msg);
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
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        animation: 'fadeIn 180ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)',
          border: '1px solid var(--border-default)',
          borderTop: '4px solid var(--primary, #0B2447)',
          position: 'relative',
          overflow: 'hidden',
          padding: '28px 26px',
        }}
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* ========================================================= */}
        {/* STEP 1: EMAIL / ID ENTRY                                  */}
        {/* ========================================================= */}
        {step === 'email' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
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
                <KeyRound size={22} />
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Forgot Your Password?
              </h2>
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Enter your registered corporate email or Employee ID. We will dispatch a
                secure 6-digit OTP for verification.
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-subtle, #fef2f2)',
                  border: '1px solid var(--danger-border, #fecaca)',
                  borderRadius: '8px',
                  color: 'var(--danger-text, #991b1b)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="forgotModalEmail"
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
                <input
                  id="forgotModalEmail"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. a4adityaarora@gmail.com or EMP007"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ flex: 1, padding: '9px 14px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '9px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="spin-animation" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: OTP VERIFICATION (6 INDIVIDUAL BOXES)             */}
        {/* ========================================================= */}
        {step === 'otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
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
                <Mail size={22} />
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                Enter Verification Code
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                We sent a 6-digit code to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-subtle, #fef2f2)',
                  border: '1px solid var(--danger-border, #fecaca)',
                  borderRadius: '8px',
                  color: 'var(--danger-text, #991b1b)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* 6 Individual Square OTP Inputs */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '18px',
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
                      ? '2px solid var(--primary, #0B2447)'
                      : '1px solid var(--border-default, #cbd5e1)',
                    backgroundColor: digit ? '#f8fafc' : '#ffffff',
                    color: 'var(--text-primary, #0f172a)',
                    outline: 'none',
                    transition: 'all 150ms ease',
                    boxShadow: digit ? '0 1px 3px rgba(11, 36, 71, 0.1)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Resend Timer & Change Email Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '20px',
                padding: '0 4px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
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
                    onClick={handleResendOtp}
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

            {/* Verify Action Button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => submitOtpVerification()}
              disabled={loading || otp.join('').length !== 6}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '10px',
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
        {/* STEP 3: SUCCESS & NEW TAB LAUNCHED                        */}
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

            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Security OTP Verified!
            </h2>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
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
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Notice: Tab Blocked by Browser?</span>
              </div>
              <p
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  margin: '0 0 10px 0',
                  lineHeight: 1.4,
                }}
              >
                If your browser popup blocker prevented the tab from automatically opening,
                use the link below to open it manually:
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ width: '100%', padding: '9px 14px', fontSize: '13px' }}
              >
                Back to Sign In Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
