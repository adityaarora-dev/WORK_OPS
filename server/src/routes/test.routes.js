const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

/**
 * ============================================================================
 * STAGE 2 DEMO / TEST AUTHORIZATION ENDPOINTS
 * NOTE: These endpoints are provided to verify role-based authorization in Stage 2.
 * ============================================================================
 */

/**
 * @route   GET /api/test/admin
 * @desc    Protected route accessible only to ADMIN
 * @access  Private (Admin)
 */
router.get(
  '/admin',
  authenticateUser,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: You have reached the ADMIN protected resource.',
      data: {
        user: req.user.toJSON(),
        accessibleRoles: ['admin'],
        permittedActions: [
          'Full system access',
          'User management',
          'Employee management',
          'Department management',
          'Attendance management',
          'Leave management',
          'Payroll management',
          'Performance management',
          'Reports',
          'System administration',
        ],
      },
    });
  }
);

/**
 * @route   GET /api/test/hr
 * @desc    Protected route accessible to ADMIN and HR
 * @access  Private (Admin, HR)
 */
router.get(
  '/hr',
  authenticateUser,
  authorizeRoles('admin', 'hr'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: You have reached the HR protected resource.',
      data: {
        user: req.user.toJSON(),
        accessibleRoles: ['admin', 'hr'],
        permittedActions: [
          'Employee management',
          'Employee profile management',
          'Attendance management',
          'Leave management',
          'HR reports',
          'Relevant HR operations',
        ],
      },
    });
  }
);

/**
 * @route   GET /api/test/manager
 * @desc    Protected route accessible to ADMIN, HR, and MANAGER
 * @access  Private (Admin, HR, Manager)
 */
router.get(
  '/manager',
  authenticateUser,
  authorizeRoles('admin', 'hr', 'manager'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: You have reached the MANAGER protected resource.',
      data: {
        user: req.user.toJSON(),
        accessibleRoles: ['admin', 'hr', 'manager'],
        permittedActions: [
          'View assigned employees',
          'View team information',
          'View team attendance',
          'Review team leave requests',
          'Approve/reject team leave where permitted',
          'Team reports',
        ],
      },
    });
  }
);

/**
 * @route   GET /api/test/employee
 * @desc    Protected route accessible to all authenticated roles (Admin, HR, Manager, Employee)
 * @access  Private (All Authenticated)
 */
router.get(
  '/employee',
  authenticateUser,
  authorizeRoles('admin', 'hr', 'manager', 'employee'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted: You have reached the EMPLOYEE protected resource.',
      data: {
        user: req.user.toJSON(),
        accessibleRoles: ['admin', 'hr', 'manager', 'employee'],
        permittedActions: [
          'View own profile',
          'View own attendance',
          'Apply for leave',
          'View own leave requests',
          'View own relevant information',
        ],
      },
    });
  }
);

module.exports = router;
