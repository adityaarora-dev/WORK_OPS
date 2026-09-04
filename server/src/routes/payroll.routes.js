const express = require('express');
const payrollController = require('../controllers/payroll.controller');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

/**
 * @route   GET /api/payroll/summary
 * @desc    Get payroll summary metrics
 * @access  Private (Admin, HR, Employee for self)
 */
router.get('/summary', payrollController.getSummary);

/**
 * @route   GET /api/payroll
 * @desc    List payroll records (scoped)
 * @access  Private (Admin, HR, Employee for self)
 */
router.get('/', payrollController.listPayroll);

/**
 * @route   POST /api/payroll
 * @desc    Generate a payroll statement
 * @access  Private (Admin, HR only)
 */
router.post('/', authorizeRoles('admin', 'hr'), payrollController.createPayroll);

/**
 * @route   GET /api/payroll/:id
 * @desc    Get detailed paystub (resource check)
 * @access  Private (Admin, HR, Employee owner)
 */
router.get('/:id', payrollController.getPayroll);

/**
 * @route   PATCH /api/payroll/:id
 * @desc    Update payroll status / values
 * @access  Private (Admin, HR only)
 */
router.patch('/:id', authorizeRoles('admin', 'hr'), payrollController.updatePayroll);

module.exports = router;
