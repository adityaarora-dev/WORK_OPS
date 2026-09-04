const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const employeeRoutes = require('./employee.routes');
const departmentRoutes = require('./department.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const payrollRoutes = require('./payroll.routes');
const documentRoutes = require('./document.routes');
const performanceRoutes = require('./performance.routes');
const recruitmentRoutes = require('./recruitment.routes');
const reportRoutes = require('./report.routes');
const notificationRoutes = require('./notification.routes');
const auditRoutes = require('./audit.routes');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/documents', documentRoutes);
router.use('/performance', performanceRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);

module.exports = router;
