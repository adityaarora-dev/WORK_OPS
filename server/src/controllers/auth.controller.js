const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const { Department } = require('../models/Department');
const { Otp } = require('../models/Otp');
const { generateToken } = require('../utils/jwt');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/email.service');
const { logAuditEvent } = require('../services/audit.service');

/**
 * Handles user login.
 * Validates credentials by email or employee ID and issues a secure JWT token.
 * If user does not exist, signals notFound so the client can offer OTP account creation.
 *
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, identifier, password } = req.body;
    const loginTarget = (email || identifier || '').trim();

    if (!loginTarget || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email/Employee ID and password are required',
      });
    }

    let normalizedTarget = loginTarget.toLowerCase();

    const ALIAS_MAP = {
      'admin@hrms.local': 'a4adityaarora@gmail.com',
      'hr@hrms.local': 'tnu23505@gmail.com',
      'manager@hrms.local': 'akshat.wadagbalkar@gmail.com',
      'employee@hrms.local': 'abhiksinha06@gmail.com',
    };

    if (ALIAS_MAP[normalizedTarget]) {
      normalizedTarget = ALIAS_MAP[normalizedTarget];
    }

    // Look up user by normalized email or employeeId
    const user = await User.findOne({
      $or: [
        { email: normalizedTarget },
        { employeeId: loginTarget.toUpperCase() },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        notFound: true,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user);

    // Audit login event (non-blocking)
    logAuditEvent({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      description: `User ${user.email} logged into the system`,
      metadata: { role: user.role, employeeId: user.employeeId },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatches a 6-digit OTP code to phone & email for account creation or verification.
 *
 * @route POST /api/auth/send-otp
 */
const sendOtp = async (req, res, next) => {
  try {
    const { email, phone, purpose = 'registration', firstName, lastName } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required to dispatch verification code.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Enforce Invite-Only Policy: Disallow public self-registration
    if (purpose === 'registration') {
      return res.status(403).json({
        success: false,
        message: 'Public account registration is disabled. Corporate employee accounts are provisioned exclusively by HR Administration.',
      });
    }

    // Generate secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous active OTPs for this email to avoid collision
    await Otp.deleteMany({ email: normalizedEmail, purpose });

    // Store in Otp collection (auto-expires in 10 minutes via TTL index)
    await Otp.create({
      email: normalizedEmail,
      phone: (phone || '').trim(),
      otp: otpCode,
      purpose,
      tempData: {
        firstName: firstName ? firstName.trim() : '',
        lastName: lastName ? lastName.trim() : '',
      },
    });

    // Dispatch real email to the user's provided email address
    const emailResult = await sendOtpEmail({
      to: normalizedEmail,
      otp: otpCode,
      purpose: 'registration',
      name: `${firstName || ''} ${lastName || ''}`.trim(),
    });

    return res.status(200).json({
      success: true,
      message: `A verification code has been dispatched to ${normalizedEmail}. Please check your email inbox.`,
      previewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies OTP and creates both User and Employee profiles directly in MongoDB.
 *
 * @route POST /api/auth/verify-otp-register
 */
const verifyOtpRegister = async (req, res, next) => {
  try {
    const { email, otp, password, firstName, lastName, phone, designation, department } = req.body;

    if (!email || !otp || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, verification OTP, password, first name, and last name are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Locate active OTP record
    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'registration',
      verified: false,
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification OTP. Please request a new code.',
      });
    }

    // Check collision again
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Generate unique sequential employee ID (e.g. EMP007, EMP008)
    const count = await User.countDocuments();
    const seq = (count + 1).toString().padStart(3, '0');
    const employeeId = `EMP${seq}`;

    // 1. Create and save User record with salt-hashed password
    const newUser = await User.create({
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password, // User schema pre-save automatically salts & hashes this
      role: 'employee',
      isActive: true,
    });

    // 2. Resolve department or pick default
    let deptId = null;
    if (department) {
      const foundDept = await Department.findOne({
        $or: [{ _id: department }, { name: new RegExp(`^${department}$`, 'i') }],
      });
      if (foundDept) deptId = foundDept._id;
    }
    if (!deptId) {
      const defaultDept = await Department.findOne({ status: 'active' });
      if (defaultDept) deptId = defaultDept._id;
    }

    // 3. Create connected Employee profile in Database
    const newEmployee = await Employee.create({
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: (phone || '').trim(),
      designation: designation ? designation.trim() : 'Software Engineer',
      department: deptId,
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date(),
      user: newUser._id,
      address: {
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
    });

    // Mark OTP as consumed
    otpDoc.verified = true;
    await otpDoc.save();

    const token = generateToken(newUser);

    console.log(`✅ [ACCOUNT CREATED] New verified employee: ${firstName} ${lastName} (${employeeId}) - ${normalizedEmail}`);

    return res.status(201).json({
      success: true,
      message: 'Account verified and registered successfully.',
      data: {
        user: newUser.toJSON(),
        employee: newEmployee,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatches an OTP for passwordless login to an existing employee.
 *
 * @route POST /api/auth/send-login-otp
 */
const sendLoginOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        notFound: true,
        message: 'No account found with this email address.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.',
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: normalizedEmail, purpose: 'login' });

    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose: 'login',
    });

    // Dispatch real email via nodemailer
    const emailResult = await sendOtpEmail({
      to: normalizedEmail,
      otp: otpCode,
      purpose: 'login',
      name: user.firstName,
    });

    return res.status(200).json({
      success: true,
      message: `A login verification code has been dispatched to ${normalizedEmail}. Please check your email inbox.`,
      previewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies Login OTP and returns JWT token.
 *
 * @route POST /api/auth/verify-login-otp
 */
const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'login',
      verified: false,
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired login OTP code.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or inactive.',
      });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'OTP authentication successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the currently authenticated user's profile.
 *
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user logout.
 *
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public registration fallback.
 */
const register = async (req, res, next) => {
  try {
    const { employeeId, firstName, lastName, email, password } = req.body;

    if (!employeeId || !firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (employeeId, firstName, lastName, email, password) are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmpId = employeeId.trim().toUpperCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { employeeId: normalizedEmpId }],
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Employee ID';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    const newUser = await User.create({
      employeeId: normalizedEmpId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      role: 'employee',
      isActive: true,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        user: newUser.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiates the Forgot Password workflow via OTP.
 * Generates a cryptographically secure 6-digit OTP,
 * hashes the OTP with SHA-256 for secure database storage,
 * and sends the 6-digit code to the user's email via SMTP.
 *
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid corporate email address or Employee ID.',
      });
    }

    let normalizedEmail = email.trim().toLowerCase();

    const ALIAS_MAP = {
      'admin@hrms.local': 'a4adityaarora@gmail.com',
      'hr@hrms.local': 'tnu23505@gmail.com',
      'manager@hrms.local': 'akshat.wadagbalkar@gmail.com',
      'employee@hrms.local': 'abhiksinha06@gmail.com',
    };

    if (ALIAS_MAP[normalizedEmail]) {
      normalizedEmail = ALIAS_MAP[normalizedEmail];
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { employeeId: email.trim().toUpperCase() },
      ],
    });

    // Security requirement: Do NOT expose whether an email exists in the system through error messages
    const genericSuccessMessage = 'If an account with that email exists, a 6-digit verification code has been dispatched to your email address.';

    if (!user || !user.isActive) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage,
        email: normalizedEmail,
      });
    }

    // Generate secure 6-digit numeric OTP code
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP with SHA-256 for secure database storage (never store plain text)
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    // Remove any previous active password_reset OTPs for this email
    await Otp.deleteMany({ email: user.email, purpose: 'password_reset' });

    // Store hashed OTP with 10-minute TTL and attempt tracking
    await Otp.create({
      email: user.email,
      otp: hashedOtp,
      purpose: 'password_reset',
      attempts: 0,
      verified: false,
    });

    // Dispatch OTP email via existing SMTP transporter
    try {
      await sendOtpEmail({
        to: user.email,
        otp: otpCode,
        purpose: 'password_reset',
        name: `${user.firstName} ${user.lastName}`,
      });
    } catch (mailErr) {
      console.error('❌ [AUTH] Failed to send password reset OTP email:', mailErr.message);
      await Otp.deleteMany({ email: user.email, purpose: 'password_reset' });

      return res.status(500).json({
        success: false,
        message: 'Unable to send verification code at this time. Please try again later or contact support.',
      });
    }

    logAuditEvent({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORGOT_PASSWORD_REQUEST',
      entityType: 'User',
      entityId: user._id,
      description: `Password reset OTP initiated for ${user.email}`,
      metadata: { role: user.role, employeeId: user.employeeId },
      req,
    });

    return res.status(200).json({
      success: true,
      message: genericSuccessMessage,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies 6-digit OTP for password reset.
 * Limits failed attempts (max 5), deletes OTP immediately upon successful verification,
 * generates a short-lived reset token (10 min) tied to user ID and email,
 * and returns dynamic resetUrl pointing to the Reset Password page.
 *
 * @route POST /api/auth/verify-otp
 * @route POST /api/auth/verify-reset-otp
 */
const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const cleanOtp = otp.toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit verification code.',
      });
    }

    let normalizedEmail = email.trim().toLowerCase();
    const ALIAS_MAP = {
      'admin@hrms.local': 'a4adityaarora@gmail.com',
      'hr@hrms.local': 'tnu23505@gmail.com',
      'manager@hrms.local': 'akshat.wadagbalkar@gmail.com',
      'employee@hrms.local': 'abhiksinha06@gmail.com',
    };
    if (ALIAS_MAP[normalizedEmail]) {
      normalizedEmail = ALIAS_MAP[normalizedEmail];
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { employeeId: email.trim().toUpperCase() },
      ],
    });

    const targetEmail = user ? user.email : normalizedEmail;

    const otpDoc = await Otp.findOne({
      email: targetEmail,
      purpose: 'password_reset',
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new code.',
      });
    }

    // Limit failed attempts to max 5
    if (otpDoc.attempts >= 5) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP code.',
      });
    }

    // Hash the entered OTP using SHA-256 to compare with stored hash
    const hashedInput = crypto.createHash('sha256').update(cleanOtp).digest('hex');

    if (hashedInput !== otpDoc.otp) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      const remainingAttempts = 5 - otpDoc.attempts;

      if (remainingAttempts <= 0) {
        await Otp.deleteOne({ _id: otpDoc._id });
        return res.status(429).json({
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP code.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      });
    }

    // Invalidate / delete OTP immediately after successful verification
    await Otp.deleteOne({ _id: otpDoc._id });

    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account not found or deactivated.',
      });
    }

    // Generate short-lived reset token (10 minutes) tied to user ID and email
    const secret = process.env.JWT_SECRET || 'jwt_secret_hrms_fallback';
    const resetToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        employeeId: user.employeeId,
        purpose: 'password_reset',
      },
      secret,
      { expiresIn: '10m' }
    );

    // Hash token with SHA-256 for secure database storage and replay prevention
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Determine client frontend URL dynamically
    const clientUrl = process.env.FRONTEND_URL || (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'http://localhost:5173');
    const cleanClientUrl = clientUrl.replace(/\/$/, '');
    const resetUrl = `${cleanClientUrl}/reset-password?token=${resetToken}`;

    logAuditEvent({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'OTP_VERIFICATION_SUCCESS',
      entityType: 'User',
      entityId: user._id,
      description: `Password reset OTP successfully verified for ${user.email}`,
      metadata: { role: user.role, employeeId: user.employeeId },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      token: resetToken,
      resetUrl,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates whether a given reset token is valid and has not expired.
 * Supports token in URL params (:token) or query params (?token=).
 *
 * @route GET /api/auth/reset-password/:token
 * @route GET /api/auth/reset-password
 */
const validateResetToken = async (req, res, next) => {
  try {
    const token = req.params.token || req.query.token;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reset token is valid.',
      email: user.email,
      employeeId: user.employeeId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resets user password using a valid token.
 * Validates new password, hashes with bcrypt via Mongoose pre-save,
 * and invalidates the reset token immediately.
 * Supports token in URL params (:token), query params (?token=), or body ({ token }).
 *
 * @route POST /api/auth/reset-password/:token
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token || req.query.token;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select('+password +resetToken +resetTokenExpiry');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      });
    }

    // Assign plain password; Mongoose userSchema.pre('save') hashes it with bcrypt (10 rounds)
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // Clean up any remaining reset OTPs
    await Otp.deleteMany({ email: user.email, purpose: 'password_reset' });

    logAuditEvent({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_SUCCESS',
      entityType: 'User',
      entityId: user._id,
      description: `Password reset completed successfully for ${user.email}`,
      metadata: { role: user.role, employeeId: user.employeeId },
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been updated successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  sendOtp,
  verifyOtpRegister,
  sendLoginOtp,
  verifyLoginOtp,
  getMe,
  logout,
  register,
  forgotPassword,
  verifyResetOtp,
  validateResetToken,
  resetPassword,
};
