const express = require('express');
const employeeController = require('../controllers/employee.controller');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// All employee routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/employees/meta/departments
 * @desc    Get list of distinct departments
 * @access  Private (All Authenticated)
 */
router.get('/meta/departments', employeeController.getDepartments);

/**
 * @route   GET /api/employees
 * @desc    List employees (Admin/HR: all; Manager: team; Employee: self)
 * @access  Private (All Authenticated)
 */
router.get('/', employeeController.listEmployees);

/**
 * @route   POST /api/employees
 * @desc    Create a new employee
 * @access  Private (Admin, HR)
 */
router.post('/', authorizeRoles('admin', 'hr'), employeeController.createEmployee);

/**
 * @route   GET /api/employees/:id
 * @desc    Get single employee details with resource-level authorization
 * @access  Private (Admin, HR, Manager for team, Employee for self)
 */
router.get('/:id', employeeController.getEmployee);

/**
 * @route   PATCH /api/employees/:id
 * @desc    Update employee administrative data
 * @access  Private (Admin, HR)
 */
router.patch('/:id', authorizeRoles('admin', 'hr'), employeeController.updateEmployee);
router.put('/:id', authorizeRoles('admin', 'hr'), employeeController.updateEmployee);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Soft-deactivate employee (sets status to inactive)
 * @access  Private (Admin, HR)
 */
router.delete('/:id', authorizeRoles('admin', 'hr'), employeeController.deactivateEmployee);

module.exports = router;
