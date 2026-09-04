const express = require('express');
const leaveController = require('../controllers/leave.controller');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

/**
 * @route   GET /api/leaves/summary
 * @desc    Leave counts (pending, approved, rejected, cancelled)
 * @access  Private (All Authenticated)
 */
router.get('/summary', leaveController.getSummary);

/**
 * @route   GET /api/leaves
 * @desc    List leave requests (scoped by role)
 * @access  Private (All Authenticated)
 */
router.get('/', leaveController.listLeaves);

/**
 * @route   POST /api/leaves
 * @desc    Apply for leave
 * @access  Private (All Authenticated)
 */
router.post('/', leaveController.applyLeave);

/**
 * @route   GET /api/leaves/:id
 * @desc    Get single leave details
 * @access  Private (All Authenticated)
 */
router.get('/:id', leaveController.getLeave);

/**
 * @route   PATCH /api/leaves/:id
 * @desc    Review leave request (approve / reject)
 * @access  Private (Admin, HR, Manager for team)
 */
router.patch('/:id', leaveController.reviewLeave);

/**
 * @route   DELETE /api/leaves/:id
 * @desc    Cancel pending leave request
 * @access  Private (Applicant or Admin/HR)
 */
router.delete('/:id', leaveController.cancelLeave);

module.exports = router;
