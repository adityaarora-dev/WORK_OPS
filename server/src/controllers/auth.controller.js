const crypto = require('crypto');
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
      'admin@hrms.local': 'aarav.sharma@company.com',
      'hr@hrms.local': 'priya.patel@company.com',
      'manager@hrms.local': 'rajesh.iyer@company.com',
      'employee@hrms.local': 'akshat.wadagbalkar@gmail.com',
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
 * Initiates the Forgot Password workflow.
 * Generates a cryptographically random, time-limited reset token,
 * hashes the token with SHA-256 for database storage, and dispatches
 * the password reset email via SMTP.
 *
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid corporate email address.',
      });
    }

    let normalizedEmail = email.trim().toLowerCase();

    const ALIAS_MAP = {
      'admin@hrms.local': 'aarav.sharma@company.com',
      'hr@hrms.local': 'priya.patel@company.com',
      'manager@hrms.local': 'rajesh.iyer@company.com',
      'employee@hrms.local': 'akshat.wadagbalkar@gmail.com',
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
    const genericSuccessMessage = 'If an account with that email exists, a password reset link has been sent to your email address.';

    if (!user || !user.isActive) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage,
      });
    }

    // Generate 32-byte cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash token with SHA-256 for secure database storage
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 15 minutes
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Determine client frontend URL
    const clientUrl = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '')
      : 'http://localhost:5173';

    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    // Send reset email via SMTP transporter
    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        name: `${user.firstName} ${user.lastName}`,
      });
    } catch (mailErr) {
      console.error('❌ [AUTH] Failed to send password reset email:', mailErr.message);
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset email at this time. Please try again later or contact support.',
      });
    }

    logAuditEvent({
      actor: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORGOT_PASSWORD_REQUEST',
      entityType: 'User',
      entityId: user._id,
      description: `Password reset request initiated for ${user.email}`,
      metadata: { role: user.role, employeeId: user.employeeId },
      req,
    });

    return res.status(200).json({
      success: true,
      message: genericSuccessMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates whether a given reset token is valid and has not expired.
 *
 * @route GET /api/auth/reset-password/:token
 */
const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

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
 *
 * @route POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
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
  validateResetToken,
  resetPassword,
};
