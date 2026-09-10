const nodemailer = require('nodemailer');
const path = require('path');

// Ensure environment variables are loaded
if (!process.env.BREVO_USER) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

/**
 * Configure Nodemailer transport using Brevo's SMTP relay on port 2525.
 * Strictly overriding the port to 2525 to bypass Render's outbound port blocking (ports 587 and 465).
 */
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

/**
 * Resolves the compliant sender address for Brevo SMTP.
 * Brevo requires a verified sender address (e.g. your account email or verified domain).
 * The login username (@smtp-brevo.com) is NOT a valid sender address.
 */
function getSenderAddress() {
  const configured = process.env.EMAIL_FROM || process.env.BREVO_FROM;
  if (configured && !configured.includes('resend.dev') && !configured.includes('smtp-brevo.com')) {
    return configured.includes('<') ? configured : `"HR Management System" <${configured}>`;
  }
  const fallback = process.env.BREVO_SENDER || 'a4adityaarora@gmail.com';
  return `"HR Management System" <${fallback}>`;
}

/**
 * Sends an email using Brevo's SMTP relay on port 2525.
 * Accepts positional parameters: sendEmail(to, subject, html, text)
 * or options object: sendEmail({ to, subject, html, text }).
 *
 * @param {string|Object} toOrOptions - Recipient email or options object
 * @param {string} [subjectParam] - Email subject
 * @param {string} [htmlParam] - HTML email body
 * @param {string} [textParam] - Plaintext email body fallback
 * @returns {Promise<{ messageId: string, previewUrl: null, success: boolean, info: Object }>}
 */
async function sendEmail(toOrOptions, subjectParam, htmlParam, textParam) {
  let to;
  let subject;
  let html;
  let text;
  let logLabel = 'BREVO SMTP EMAIL';
  let extraLog = null;

  if (typeof toOrOptions === 'object' && toOrOptions !== null) {
    to = toOrOptions.to;
    subject = toOrOptions.subject;
    html = toOrOptions.html;
    text = toOrOptions.text;
    if (toOrOptions.logLabel) logLabel = toOrOptions.logLabel;
    if (toOrOptions.extraLog) extraLog = toOrOptions.extraLog;
  } else {
    to = toOrOptions;
    subject = subjectParam;
    html = htmlParam;
    text = textParam;
  }

  const from = getSenderAddress();
  const mailOptions = {
    from,
    to,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]*>?/gm, '').trim() : ''),
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log('====================================================');
    console.log(`✉️  [${logLabel} DISPATCHED]`);
    console.log(`    Provider:   Brevo SMTP (smtp-relay.brevo.com:2525)`);
    console.log(`    From:       ${from}`);
    console.log(`    Recipient:  ${to}`);
    console.log(`    Subject:    ${subject}`);
    if (extraLog) console.log(`    ${extraLog}`);
    console.log(`    Message ID: ${info.messageId}`);
    console.log('====================================================');

    return {
      messageId: info.messageId,
      previewUrl: null,
      success: true,
      info,
    };
  } catch (error) {
    console.error('====================================================');
    console.error(`❌ [${logLabel} FAILED]`);
    console.error(`    Provider:   Brevo SMTP (smtp-relay.brevo.com:2525)`);
    console.error(`    From:       ${from}`);
    console.error(`    Recipient:  ${to}`);
    console.error(`    Subject:    ${subject}`);
    console.error(`    Error Code: ${error.code || 'N/A'}`);
    console.error(`    Error Msg:  ${error.message}`);
    console.error('====================================================');

    // Throw the error in the catch block so calling controllers know if sending failed
    throw error;
  }
}

/**
 * Unified dispatch alias pointing to sendEmail.
 */
const dispatchEmail = sendEmail;

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
  const rawUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://workops-22.vercel.app';
  const urls = rawUrl.split(',').map((u) => u.trim().replace(/\/$/, '')).filter(Boolean);
  const portalUrl = urls.find((u) => u.includes('vercel.app') || !u.includes('localhost')) || urls[0] || 'https://workops-22.vercel.app';
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@hrms.internal';

  const purposeMessage = isPasswordReset
    ? 'You requested to reset your HRMS corporate account password.'
    : isRegistration
    ? 'Thank you for initiating your corporate account registration. To activate your employee workspace, please verify your email address.'
    : 'You requested a secure passwordless login to your HRMS workspace.';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table, td {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .mobile-padding {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
      .otp-code {
        font-size: 32px !important;
        letter-spacing: 7px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 32px 12px; background-color: #f8fafc; color: #0f172a;">
  <!-- Preheader text (Preview in inbox) -->
  <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your HRMS verification code is ${otp}. This code expires in 10 minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; margin: 0 auto;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);">
          <!-- Top Header Brand Accent -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #2563eb, #3b82f6);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2563eb; background-color: #eff6ff; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;">
                      Identity & Access Management
                    </span>
                    <h1 style="margin: 0; font-size: 19px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">
                      HR Management System
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e293b;">
                ${greeting}
              </p>
              <p style="margin: 0 0 28px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
                ${purposeMessage} Please use the 6-digit verification code below to complete authentication:
              </p>

              <!-- OTP Prominent Minimalist Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 12px;">
                      One-Time Verification Code
                    </div>
                    
                    <div class="otp-code" style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; padding: 4px 0 12px 0;">
                      ${otp}
                    </div>

                    <div style="display: inline-block; font-size: 12px; font-weight: 500; color: #64748b; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 16px;">
                      ⏱️ Expires in <strong style="color: #0f172a;">10 minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #92400e;">
                      <strong>Security Notice:</strong> Never share this code with anyone. HR personnel and IT administrators will never ask for your verification code.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Help & Support Section -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #334155;">
                      Need help or didn't request this?
                    </p>
                    <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #64748b;">
                      Contact our internal IT Helpdesk at 
                      <a href="mailto:${supportEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${supportEmail}</a> 
                      or visit the <a href="${portalUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Employee Portal Support Center</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td class="mobile-padding" style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-size: 11.5px; color: #94a3b8;">
                © 2026 HR Management System. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                This is an automated system email sent for identity verification. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return dispatchEmail({
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

  return dispatchEmail({
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

  return dispatchEmail({
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

  return dispatchEmail({
    to,
    subject: subject || title || 'Enterprise HRMS Notification',
    html: htmlContent,
    text: `${greeting}\n\n${title}\n\n${message}\n\nWorkspace Link: ${portalUrl}/dashboard`,
    logLabel: 'NOTIFICATION',
    extraLog: `Title: ${title}`,
  });
}

module.exports = {
  transporter,
  sendEmail,
  dispatchEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
