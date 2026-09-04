const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateUser);

/**
 * @route   GET /api/attendance/summary
 * @desc    Today's attendance stats
 * @access  Private (All Authenticated)
 */
router.get('/summary', attendanceController.getSummary);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance logs (scoped by role)
 * @access  Private (All Authenticated)
 */
router.get('/', attendanceController.listAttendance);

/**
 * @route   POST /api/attendance
 * @desc    Clock in / Mark attendance
 * @access  Private (All Authenticated)
 */
router.post('/', attendanceController.markAttendance);

/**
 * @route   GET /api/attendance/:id
 * @desc    Get single attendance record
 * @access  Private (All Authenticated)
 */
router.get('/:id', attendanceController.getAttendance);

/**
 * @route   PATCH /api/attendance/:id
 * @desc    Clock out / Correct attendance record
 * @access  Private (All Authenticated)
 */
router.patch('/:id', attendanceController.updateAttendance);

module.exports = router;
