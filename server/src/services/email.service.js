const { Resend } = require('resend');

let resendClient = null;

/**
 * Returns the active Resend SDK client instance.
 * Lazily initialized with the corporate API key.
 */
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [EMAIL SERVICE] RESEND_API_KEY is not configured in environment variables.');
    }
    resendClient = new Resend(apiKey || 're_not_configured');
    console.log('📧 [EMAIL SERVICE] Resend client initialized.');
  }
  return resendClient;
}

/**
 * Resolves the compliant sender address for Resend.
 * Defaults to 'HR Management System <onboarding@resend.dev>'.
 */
function getSenderAddress() {
  const configured = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  if (configured && !/@gmail\.com/i.test(configured) && !/@hrms\.internal/i.test(configured)) {
    return configured;
  }
  return 'HR Management System <onboarding@resend.dev>';
}

/**
 * Core dispatcher that sends corporate emails via Resend REST API.
 * Seamlessly handles both production custom domains and default onboarding@resend.dev.
 */
async function dispatchResendEmail({ to, subject, html, text, logLabel = 'EMAIL', extraLog = null }) {
  const resend = getResendClient();
  const from = getSenderAddress();

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      // Check if Resend free testing domain restriction occurred
      // (onboarding@resend.dev only allows sending to the verified account owner email)
      const isSandboxRestriction =
        (error.statusCode === 403 &&
          typeof error.message === 'string' &&
          error.message.includes('only send testing emails to your own email address')) ||
        (error.statusCode === 422 &&
          typeof error.message === 'string' &&
          error.message.includes('Please use our testing email address'));

      if (isSandboxRestriction) {
        console.warn('====================================================');
        console.warn(`⚠️  [RESEND SANDBOX NOTICE - ${logLabel}]`);
        console.warn(`    Recipient: ${to}`);
        console.warn(`    Subject:   ${subject}`);
        if (extraLog) console.warn(`    ${extraLog}`);
        console.warn(`    Notice:    The testing domain (onboarding@resend.dev)`);
        console.warn(`               delivers directly to the Resend account owner.`);
        console.warn(`               To deliver to all external recipients in production,`);
        console.warn(`               verify your corporate domain at: resend.com/domains`);
        console.warn('====================================================');

        const mockId = `resend_sandbox_${Date.now()}`;
        return {
          id: mockId,
          messageId: mockId,
          previewUrl: null,
          sandbox: true,
          delivered: false,
        };
      }

      throw new Error(`[Resend ${error.name || 'Error'} ${error.statusCode || ''}]: ${error.message}`);
    }

    const emailId = data?.id;
    console.log('====================================================');
    console.log(`✉️  [RESEND ${logLabel} DISPATCHED]`);
    console.log(`    Recipient: ${to}`);
    console.log(`    Subject:   ${subject}`);
    if (extraLog) console.log(`    ${extraLog}`);
    console.log(`    Resend ID: ${emailId}`);
    console.log('====================================================');

    return {
      id: emailId,
      messageId: emailId,
      previewUrl: `https://resend.com/emails/${emailId}`,
      delivered: true,
      sandbox: false,
    };
  } catch (err) {
    console.error(`❌ [RESEND ${logLabel} FAILED] To: ${to} | Error: ${err.message}`);
    throw err;
  }
}

/**
 * Sends a real corporate OTP email to the user's provided email address.
 *
 * @param {Object} options
 * @param {string} options.to - Target recipient email
 * @param {string} options.otp - 6-digit verification code
 * @param {string} options.purpose - 'registration' | 'login'
 * @param {string} [options.name] - User full name
 * @returns {Promise<{ messageId: string, previewUrl?: string }>}
 */
async function sendOtpEmail({ to, otp, purpose = 'registration', name = '' }) {
  const isRegistration = purpose === 'registration';
  const isPasswordReset = purpose === 'password_reset';
  const subject = isPasswordReset
    ? `Your HRMS Password Reset Code: ${otp}`
    : isRegistration
    ? `Your HRMS Registration Verification Code: ${otp}`
    : `Your HRMS Login Verification Code: ${otp}`;

  const greeting = name ? `Hello ${name},` : 'Hello,';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      color: #0f172a;
    }
    .email-container {
      max-width: 560px;
      margin: 30px auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background-color: #0f172a;
      padding: 24px 32px;
      border-bottom: 2px solid #2563eb;
    }
    .email-header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }
    .email-header p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .email-body {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1e293b;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-card {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin-bottom: 24px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #2563eb;
      margin: 4px 0;
    }
    .otp-expiry {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .security-note {
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
      border-left: 3px solid #e2e8f0;
      padding-left: 12px;
      margin-top: 24px;
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 16px 32px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>HR Management System</h1>
      <p>Identity Verification & Workforce Operations</p>
    </div>
    <div class="email-body">
      <div class="greeting">${greeting}</div>
      <p class="message">
        ${
          isPasswordReset
            ? 'You requested to reset your HRMS corporate account password. Please use the following 6-digit one-time password (OTP) to verify your identity:'
            : isRegistration
            ? 'Thank you for initiating your corporate account creation. To verify your email address and activate your employee workspace, please use the following one-time password (OTP):'
            : 'You requested a secure passwordless login to your HRMS workspace. Please use the following one-time password (OTP) to complete sign-in:'
        }
      </p>

      <div class="otp-card">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱️ Valid for 10 minutes from dispatch</div>
      </div>

      <p class="message">
        Enter this 6-digit code on the HRMS sign-in portal to complete verification.
      </p>

      <div class="security-note">
        <strong>Security Notice:</strong> Never share this code with anyone. HR personnel will never ask for your verification code. If you did not initiate this request, please contact IT Security immediately.
      </div>
    </div>
    <div class="email-footer">
      This is an automated system email generated by HR Management System • Please do not reply directly.
    </div>
  </div>
</body>
</html>
  `;

  return dispatchResendEmail({
    to,
    subject,
    html: htmlContent,
    text: `Your HRMS verification code is: ${otp}. This code is valid for 10 minutes.`,
    logLabel: 'OTP EMAIL',
    extraLog: `🔑 OTP Code:  ${otp}`,
  });
}

/**
 * Sends an official corporate onboarding activation email to newly provisioned employees.
 *
 * @param {Object} options
 * @param {string} options.to - Employee email address
 * @param {string} options.name - Employee full name
 * @param {string} options.employeeId - Assigned employee identifier (e.g. EMP007)
 * @param {string} options.tempPassword - Temporary access password
 * @param {string} options.designation - Assigned designation
 */
async function sendWelcomeEmail({ to, name, employeeId, tempPassword, designation }) {
  const rawUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://workops-22.vercel.app';
  const urls = rawUrl.split(',').map((u) => u.trim().replace(/\/$/, '')).filter(Boolean);
  const portalUrl = urls.find((u) => u.includes('vercel.app') || !u.includes('localhost')) || urls[0] || 'https://workops-22.vercel.app';

  const subject = `Welcome to the Team, ${name}! Your HRMS Corporate Access is Ready`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: #0f172a; padding: 24px 32px; border-bottom: 2px solid #2563eb; color: #ffffff; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; color: #f8fafc; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .body { padding: 32px; }
    .creds-card { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .label { color: #64748b; font-weight: 500; }
    .val { color: #0f172a; font-weight: 600; font-family: monospace; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; margin-top: 10px; }
    .footer { background-color: #f8fafc; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HR Management System</h1>
      <p>Official Workforce Onboarding & Identity Provisioning</p>
    </div>
    <div class="body">
      <h2 style="font-size: 16px; margin-top: 0;">Welcome aboard, ${name}!</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Your corporate employee record has been officially provisioned in the HR Management System as <strong>${designation}</strong>.
      </p>

      <div class="creds-card">
        <div class="row"><span class="label">Employee ID:</span><span class="val">${employeeId}</span></div>
        <div class="row"><span class="label">Official Email:</span><span class="val">${to}</span></div>
        <div class="row"><span class="label">Temporary Password:</span><span class="val">${tempPassword}</span></div>
      </div>

      <p style="font-size: 13px; color: #475569;">
        You can sign in using your password or request a real-time OTP to this email anytime.
      </p>

      <a href="${portalUrl}/login" class="btn" target="_blank">Sign In to HRMS Portal</a>
    </div>
    <div class="footer">
      Corporate HR Operations • Confidential Access
    </div>
  </div>
</body>
</html>
  `;

  return dispatchResendEmail({
    to,
    subject,
    html: htmlContent,
    text: `Welcome ${name}! Your employee ID is ${employeeId} and temporary password is ${tempPassword}. Portal URL: ${portalUrl}/login`,
    logLabel: 'ONBOARDING EMAIL',
    extraLog: `Employee ID: ${employeeId}`,
  });
}

/**
 * Sends a password reset link to the user's email address.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.resetUrl - Full password reset URL including token
 * @param {string} [options.name] - User full name
 * @returns {Promise<{ messageId: string, previewUrl?: string }>}
 */
async function sendPasswordResetEmail({ to, resetUrl, name = '' }) {
  const subject = 'Reset Your Enterprise HRMS Password';
  const greeting = name ? `Hello ${name},` : 'Hello,';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
    .header { background-color: #0B2447; color: #ffffff; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #b1c7dc; }
    .body { padding: 32px; font-size: 14px; line-height: 1.6; color: #334155; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #2563EB; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .link-box { background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; margin-top: 16px; }
    .notice { background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px 16px; font-size: 12.5px; color: #9a3412; border-radius: 4px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 16px 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Enterprise HRMS</h1>
      <p>Identity & Access Management Security Services</p>
    </div>
    <div class="body">
      <p style="margin-top: 0; font-weight: 600; font-size: 15px; color: #0f172a;">${greeting}</p>
      <p>
        We received a request to reset the password for your corporate account associated with <strong>${to}</strong>.
      </p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
      </div>
      <div class="notice">
        <strong>Security Notice:</strong> This password reset link is cryptographically protected and expires in <strong>15 minutes</strong>. It can only be used once.
      </div>
      <p style="font-size: 13px; color: #64748b;">
        If the button above does not work, copy and paste this secure link directly into your browser:
      </p>
      <div class="link-box">
        ${resetUrl}
      </div>
      <p style="font-size: 12.5px; color: #94a3b8; margin-top: 24px;">
        If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged and secure.
      </p>
    </div>
    <div class="footer">
      Enterprise HR Management System • Confidential Security Communication
    </div>
  </div>
</body>
</html>
  `;

  return dispatchResendEmail({
    to,
    subject,
    html: htmlContent,
    text: `${greeting}\n\nWe received a request to reset your password. Use the following link within 15 minutes to set a new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    logLabel: 'PASSWORD RESET',
    extraLog: `Reset URL: ${resetUrl}`,
  });
}

/**
 * Sends a notification email to the user's registered Gmail address.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.name] - User full name
 * @param {string} [options.type] - Notification type
 * @returns {Promise<{ messageId: string }>}
 */
async function sendNotificationEmail({ to, subject, title, message, name = '', type = 'system' }) {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const rawUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://workops-22.vercel.app';
  const urls = rawUrl.split(',').map((u) => u.trim().replace(/\/$/, '')).filter(Boolean);
  const portalUrl = urls.find((u) => u.includes('vercel.app') || !u.includes('localhost')) || urls[0] || 'https://workops-22.vercel.app';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05); }
    .header { background-color: #0B2447; color: #ffffff; padding: 22px 28px; text-align: left; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #b1c7dc; }
    .body { padding: 28px; font-size: 14px; line-height: 1.6; color: #334155; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563EB; border-radius: 8px; padding: 16px; margin: 18px 0; }
    .btn { display: inline-block; background-color: #2563EB; color: #ffffff !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; margin-top: 14px; }
    .footer { background-color: #f8fafc; padding: 14px 28px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Enterprise HRMS</h1>
      <p>Corporate Notification & Workflow Update</p>
    </div>
    <div class="body">
      <p style="margin-top: 0; font-weight: 600; font-size: 15px; color: #0f172a;">${greeting}</p>
      <div class="card">
        <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 6px;">${title}</strong>
        <p style="margin: 0; font-size: 13.5px; color: #475569;">${message}</p>
      </div>
      <a href="${portalUrl}/dashboard" class="btn" target="_blank">Open Corporate Workspace</a>
    </div>
    <div class="footer">
      Enterprise HR Management System • Confidential Notification
    </div>
  </div>
</body>
</html>
  `;

  return dispatchResendEmail({
    to,
    subject: subject || title || 'Enterprise HRMS Notification',
    html: htmlContent,
    text: `${greeting}\n\n${title}\n\n${message}\n\nWorkspace Link: ${portalUrl}/dashboard`,
    logLabel: 'NOTIFICATION',
    extraLog: `Title: ${title}`,
  });
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  getResendClient,
};
