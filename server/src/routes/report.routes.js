const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const reportController = require('../controllers/report.controller');

const router = express.Router();

// Apply authentication to all report endpoints
router.use(authenticateUser);

// 1. Executive / Team Overview
router.get('/overview', reportController.getOverview);

// 2. Workforce / Employee Demographics
router.get('/employees', reportController.getEmployeesReport);

// 3. Attendance Analytics & Compliance
router.get('/attendance', reportController.getAttendanceReport);

// 4. Leave & Absenteeism Analytics
router.get('/leave', reportController.getLeaveReport);

// 5. Payroll Expenditure & Trends (Admin, HR, Employee personal only; Manager forbidden)
router.get('/payroll', reportController.getPayrollReport);

// 6. Performance & Goal Scorecard Analytics
router.get('/performance', reportController.getPerformanceReport);

// 7. Recruitment Funnel & Talent Acquisition (Admin & HR exclusive)
router.get('/recruitment', authorizeRoles('admin', 'hr'), reportController.getRecruitmentReport);

module.exports = router;
