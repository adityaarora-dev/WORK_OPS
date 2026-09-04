const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const { connectDB } = require('../config/db');

const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../utils/jwt');
const reportService = require('../services/report.service');
const notificationService = require('../services/notification.service');
const auditService = require('../services/audit.service');

let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
  }
};

const runStage11Tests = async () => {
  console.log('===============================================================');
  console.log('📊 RUNNING STAGE 11: REPORTS, NOTIFICATIONS & AUDIT LOGS SUITE');
  console.log('===============================================================');

  try {
    await connectDB();
    console.log(' Connected to MongoDB Atlas\n');

    // 1. Resolve Users for 4 Roles
    const [adminUser, hrUser, mgrUser, empUser] = await Promise.all([
      User.findOne({ role: 'admin' }),
      User.findOne({ role: 'hr' }),
      User.findOne({ role: 'manager' }),
      User.findOne({ role: 'employee' }),
    ]);

    assert(adminUser && hrUser && mgrUser && empUser, 'All four role accounts resolved in DB');

    // 2. REPORT OVERVIEW
    console.log('\n--- 1. REPORT OVERVIEW & ROLE SCOPING ---');
    const adminOverview = await reportService.getOverviewReport({ user: adminUser });
    assert(adminOverview && adminOverview.employees && adminOverview.employees.total > 0, 'Admin accesses organization overview with headcount');
    assert(adminOverview.recruitment !== null, 'Admin overview includes recruitment metrics');

    const mgrOverview = await reportService.getOverviewReport({ user: mgrUser });
    assert(mgrOverview && mgrOverview.employees !== undefined, 'Manager accesses team overview report');
    assert(mgrOverview.recruitment === null, 'Manager overview excludes recruitment metrics');

    const empOverview = await reportService.getOverviewReport({ user: empUser });
    assert(empOverview && empOverview.employees !== undefined, 'Employee accesses personal overview report');
    assert(empOverview.recruitment === null, 'Employee overview excludes recruitment metrics');

    // 3. EMPLOYEE REPORTS & CSV EXPORT
    console.log('\n--- 2. EMPLOYEE REPORTS & CSV EXPORT ---');
    const empReport = await reportService.getEmployeesReport({ user: adminUser });
    assert(empReport.total > 0, 'Employee report returns total workforce count');
    assert(Array.isArray(empReport.byDepartment), 'Employee report includes department breakdown');
    assert(Array.isArray(empReport.byEmploymentType), 'Employee report includes employment type breakdown');

    const headers = ['Employee ID', 'Name', 'Designation', 'Department'];
    const rows = (empReport.recentJoiners || []).map((e) => [e.employeeId, `${e.firstName} ${e.lastName}`, e.designation, 'Tech']);
    const csvOutput = reportService.generateCsv(headers, rows);
    assert(csvOutput.includes('Employee ID') && csvOutput.includes('Name'), 'RFC 4180 CSV export generated successfully');

    // 4. ATTENDANCE & LEAVE REPORTS
    console.log('\n--- 3. ATTENDANCE & LEAVE REPORTS ---');
    const attReport = await reportService.getAttendanceReport({ user: adminUser });
    assert(attReport.summary && typeof attReport.summary.attendancePercentage === 'number', 'Attendance report calculates attendance rate %');
    assert(Array.isArray(attReport.dailyTrends), 'Attendance report includes daily trend logs');

    const leaveReport = await reportService.getLeaveReport({ user: adminUser });
    assert(leaveReport.summary && typeof leaveReport.summary.totalRequests === 'number', 'Leave report aggregates total leave requests');
    assert(Array.isArray(leaveReport.byType), 'Leave report categorizes leaves by type');

    // 5. PAYROLL REPORT AUTHORIZATION
    console.log('\n--- 4. PAYROLL REPORT AUTHORIZATION ---');
    const adminPayroll = await reportService.getPayrollReport({ user: adminUser });
    assert(adminPayroll.summary && adminPayroll.summary.totalNet !== undefined, 'Admin views organizational payroll report');

    let mgrPayrollBlocked = false;
    try {
      await reportService.getPayrollReport({ user: mgrUser });
    } catch (err) {
      mgrPayrollBlocked = true;
    }
    assert(mgrPayrollBlocked, 'Manager is strictly forbidden from organizational payroll reports');

    const empPayroll = await reportService.getPayrollReport({ user: empUser });
    assert(empPayroll && Array.isArray(empPayroll.monthlyTrends), 'Employee accesses personal payroll statement');
    assert(empPayroll.byDepartment.length === 0, 'Employee report excludes organizational department payroll breakdown');

    // 6. RECRUITMENT REPORT RESTRICTIONS
    console.log('\n--- 5. RECRUITMENT REPORT AUTHORIZATION ---');
    const adminRecruitment = await reportService.getRecruitmentReport({ user: adminUser });
    assert(adminRecruitment.metrics && adminRecruitment.metrics.openJobs >= 0, 'Admin accesses talent acquisition & recruitment metrics');
    assert(Array.isArray(adminRecruitment.funnel) && adminRecruitment.funnel.length > 0, 'Recruitment report generates hiring funnel stages');

    let empRecruitmentBlocked = false;
    try {
      await reportService.getRecruitmentReport({ user: empUser });
    } catch (err) {
      empRecruitmentBlocked = true;
    }
    assert(empRecruitmentBlocked, 'Employee is forbidden from accessing recruitment reports');

    // 7. NOTIFICATIONS LIFECYCLE
    console.log('\n--- 6. NOTIFICATION SYSTEM ---');
    const notification = await notificationService.createNotification({
      recipient: empUser._id,
      type: 'leave',
      title: 'Automated Test Notification',
      message: 'Your leave application was approved by manager.',
      relatedEntity: 'Leave',
    });
    assert(notification && notification._id, 'Notification created successfully');

    const notifList = await notificationService.getNotifications({ userId: empUser._id });
    assert(notifList.notifications.length > 0, 'User fetches notifications list');
    assert(notifList.unreadCount > 0, 'Unread count computed accurately');

    const readItem = await notificationService.markAsRead(notification._id, empUser._id);
    assert(readItem && readItem.read === true, 'Notification marked as read');

    const markAllResult = await notificationService.markAllAsRead(empUser._id);
    assert(typeof markAllResult.modifiedCount === 'number', 'Mark all notifications as read executes cleanly');

    const newUnread = await notificationService.getUnreadCount(empUser._id);
    assert(newUnread === 0, 'Unread count resets to 0 after markAllAsRead');

    // 8. AUDIT LOGGING & SECURITY SANITIZATION
    console.log('\n--- 7. AUDIT LOGGING & DATA SANITIZATION ---');
    await auditService.logAuditEvent({
      actor: adminUser._id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'SYSTEM_SETTINGS_UPDATE',
      entityType: 'Department',
      description: 'Automated test audit event',
      metadata: {
        departmentName: 'Engineering',
        password: 'SuperSecretPassword123!', // Must be redacted
        jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Must be redacted
        nested: {
          secretKey: 'SecretValue', // Must be redacted
          safeInfo: 'PublicValue',
        },
      },
    });

    const auditResult = await auditService.getAuditLogs({
      action: 'SYSTEM_SETTINGS_UPDATE',
      userRole: 'admin',
    });
    assert(auditResult.logs.length > 0, 'Admin retrieves audit logs');

    const testLog = auditResult.logs[0];
    assert(testLog.metadata.password === '[REDACTED]', 'Sensitive password redacted in audit metadata');
    assert(testLog.metadata.jwtToken === '[REDACTED]', 'JWT token redacted in audit metadata');
    assert(testLog.metadata.nested.secretKey === '[REDACTED]', 'Nested secrets redacted in audit metadata');
    assert(testLog.metadata.nested.safeInfo === 'PublicValue', 'Non-sensitive metadata preserved');

    // Clean up test records
    await Notification.findByIdAndDelete(notification._id);
    await AuditLog.findByIdAndDelete(testLog._id);

    console.log('\n===============================================================');
    console.log(`📊 STAGE 11 SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================');
  } catch (error) {
    console.error('Test execution exception:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  }
};

runStage11Tests();
