const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and retrieve JWT token
 * @access  Public
 */
router.post('/login', authController.login);

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
 * @desc    Public employee registration (role forced to employee)
 * @access  Public
 */
router.post('/register', authController.register);

module.exports = router;
