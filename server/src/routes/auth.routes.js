const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user with email/ID and password
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Dispatch 6-digit OTP code to email & phone for registration
 * @access  Public
 */
router.post('/send-otp', authController.sendOtp);

/**
 * @route   POST /api/auth/verify-otp-register
 * @desc    Verify OTP code and create User + Employee profiles in database
 * @access  Public
 */
router.post('/verify-otp-register', authController.verifyOtpRegister);

/**
 * @route   POST /api/auth/send-login-otp
 * @desc    Send OTP to registered email/phone for passwordless login
 * @access  Public
 */
router.post('/send-login-otp', authController.sendLoginOtp);

/**
 * @route   POST /api/auth/verify-login-otp
 * @desc    Verify OTP for passwordless login
 * @access  Public
 */
router.post('/verify-login-otp', authController.verifyLoginOtp);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve currently authenticated user profile
 * @access  Private (Authenticated)
 */
router.get('/me', authenticateUser, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate user session
 * @access  Public / Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/register
 * @desc    Public employee registration
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token and dispatch email
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   GET /api/auth/reset-password/:token
 * @desc    Validate password reset token
 * @access  Public
 */
router.get('/reset-password/:token', authController.validateResetToken);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Save new password with token and invalidate token
 * @access  Public
 */
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
