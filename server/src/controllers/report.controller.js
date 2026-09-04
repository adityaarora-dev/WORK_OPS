const reportService = require('../services/report.service');
const { logAuditEvent } = require('../services/audit.service');

/**
 * Sends CSV file download response.
 */
const sendCsvResponse = (res, filename, csvContent) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
};

const getOverview = async (req, res, next) => {
  try {
    const data = await reportService.getOverviewReport({
      user: req.user,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      departmentId: req.query.department,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getEmployeesReport = async (req, res, next) => {
  try {
    const data = await reportService.getEmployeesReport({
      user: req.user,
      departmentId: req.query.department,
      status: req.query.status,
      employmentType: req.query.employmentType,
    });

    if (req.query.export === 'csv') {
      const headers = ['Employee ID', 'Name', 'Designation', 'Department', 'Employment Type', 'Status', 'Joining Date'];
      const rows = (data.recentJoiners || []).map((e) => [
        e.employeeId,
        `${e.firstName} ${e.lastName}`,
        e.designation,
        e.department?.name || 'Unassigned',
        e.employmentType,
        e.status,
        e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '',
      ]);
      const csv = reportService.generateCsv(headers, rows);
      return sendCsvResponse(res, `employees_report_${Date.now()}.csv`, csv);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const data = await reportService.getAttendanceReport({
      user: req.user,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      departmentId: req.query.department,
    });

    if (req.query.export === 'csv') {
      const headers = ['Date', 'Present', 'Absent', 'Late', 'Half Day', 'Total Logs'];
      const rows = (data.dailyTrends || []).map((d) => [
        d.date,
        d.present,
        d.absent,
        d.late,
        d.halfDay,
        d.total,
      ]);
      const csv = reportService.generateCsv(headers, rows);
      return sendCsvResponse(res, `attendance_report_${Date.now()}.csv`, csv);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const data = await reportService.getLeaveReport({
      user: req.user,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      departmentId: req.query.department,
      status: req.query.status,
    });

    if (req.query.export === 'csv') {
      const headers = ['Month', 'Approved Days', 'Pending Days', 'Rejected Days', 'Total Requests'];
      const rows = (data.monthlyTrends || []).map((m) => [
        m.month,
        m.approvedDays,
        m.pendingDays,
        m.rejectedDays,
        m.totalRequests,
      ]);
      const csv = reportService.generateCsv(headers, rows);
      return sendCsvResponse(res, `leave_report_${Date.now()}.csv`, csv);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getPayrollReport = async (req, res, next) => {
  try {
    const data = await reportService.getPayrollReport({
      user: req.user,
      year: req.query.year,
    });

    if (req.query.export === 'csv') {
      const headers = ['Month', 'Gross Total (INR)', 'Deductions (INR)', 'Net Total (INR)', 'Pay Slips Processed'];
      const rows = (data.monthlyTrends || []).map((m) => [
        `Month ${m.month}`,
        m.gross,
        m.deductions,
        m.net,
        m.count,
      ]);
      const csv = reportService.generateCsv(headers, rows);
      return sendCsvResponse(res, `payroll_report_${Date.now()}.csv`, csv);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    if (err.message.includes('not authorized')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getPerformanceReport = async (req, res, next) => {
  try {
    const data = await reportService.getPerformanceReport({
      user: req.user,
      cycleId: req.query.cycle,
      departmentId: req.query.department,
    });

    if (req.query.export === 'csv') {
      const headers = ['Employee ID', 'Employee Name', 'Reviewer', 'Cycle', 'Rating', 'Status'];
      const rows = (data.recentReviews || []).map((r) => [
        r.employee?.employeeId,
        `${r.employee?.firstName} ${r.employee?.lastName}`,
        r.reviewer?.name,
        r.reviewCycle?.name,
        r.overallRating,
        r.status,
      ]);
      const csv = reportService.generateCsv(headers, rows);
      return sendCsvResponse(res, `performance_report_${Date.now()}.csv`, csv);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getRecruitmentReport = async (req, res, next) => {
  try {
    const data = await reportService.getRecruitmentReport({
      user: req.user,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    if (req.query.export === 'csv') {
      const headers = ['Hiring Stage', 'Candidate Count'];
      const rows = (data.funnel || []).map((f) => [f.stage, f.count]);
      const csv = reportService.generateCsv(headers, rows);
      return sendCsvResponse(res, `recruitment_funnel_${Date.now()}.csv`, csv);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    if (err.message.includes('Access denied') || err.message.includes('restricted')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

module.exports = {
  getOverview,
  getEmployeesReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getPerformanceReport,
  getRecruitmentReport,
};
