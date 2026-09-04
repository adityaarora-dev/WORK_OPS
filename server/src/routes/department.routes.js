const express = require('express');
const departmentController = require('../controllers/department.controller');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

/**
 * @route   GET /api/departments
 * @desc    List departments with pagination & employee counts
 * @access  Private (All Authenticated)
 */
router.get('/', departmentController.listDepartments);

/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Private (Admin, HR)
 */
router.post('/', authorizeRoles('admin', 'hr'), departmentController.createDepartment);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department details and assigned employees
 * @access  Private (All Authenticated)
 */
router.get('/:id', departmentController.getDepartment);

/**
 * @route   PATCH /api/departments/:id
 * @desc    Update department information
 * @access  Private (Admin, HR)
 */
router.patch('/:id', authorizeRoles('admin', 'hr'), departmentController.updateDepartment);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Safely deactivate a department (blocked if active employees assigned)
 * @access  Private (Admin, HR)
 */
router.delete('/:id', authorizeRoles('admin', 'hr'), departmentController.deactivateDepartment);

module.exports = router;
