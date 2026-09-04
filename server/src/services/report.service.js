const mongoose = require('mongoose');
const { Employee } = require('../models/Employee');
const { Department } = require('../models/Department');
const { Attendance } = require('../models/Attendance');
const { Leave } = require('../models/Leave');
const { Payroll } = require('../models/Payroll');
const { PerformanceReview } = require('../models/PerformanceReview');
const { EmployeeGoal } = require('../models/EmployeeGoal');
const { PerformanceReviewCycle } = require('../models/PerformanceReviewCycle');
const { JobOpening } = require('../models/JobOpening');
const { Candidate } = require('../models/Candidate');
const { JobApplication } = require('../models/JobApplication');
const { Interview } = require('../models/Interview');

/**
 * Resolves scoped employee IDs based on requester role.
 * - Admin/HR: null (indicates unrestricted org-wide access)
 * - Manager: array of ObjectIds for direct reports + manager self
 * - Employee: array of single ObjectId for self
 */
const getScopedEmployeeIds = async (user) => {
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'hr') {
    return null; // Unrestricted
  }

  const emp = await Employee.findOne({
    $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
  }).select('_id');

  if (!emp) {
    return []; // No employee record attached
  }

  if (role === 'manager') {
    const team = await Employee.find({
      $or: [{ manager: emp._id }, { _id: emp._id }],
    }).select('_id');
    return team.map((e) => e._id);
  }

  // Employee role
  return [emp._id];
};

/**
 * Helper to build Date filter range
 */
const buildDateRange = (startDate, endDate) => {
  const range = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length > 0 ? range : null;
};

/**
 * GET /api/reports/overview
 */
const getOverviewReport = async ({ user, startDate, endDate, departmentId }) => {
  const scopedIds = await getScopedEmployeeIds(user);
  const role = (user.role || '').toLowerCase();

  const empQuery = { isDeleted: { $ne: true } };
  if (scopedIds !== null) {
    empQuery._id = { $in: scopedIds };
  }
  if (departmentId) {
    empQuery.department = new mongoose.Types.ObjectId(departmentId);
  }

  const [totalEmployees, activeEmployees, departmentsCount] = await Promise.all([
    Employee.countDocuments(empQuery),
    Employee.countDocuments({ ...empQuery, status: 'active' }),
    Department.countDocuments({ status: 'active' }),
  ]);

  // Attendance recent rate (past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const attQuery = { date: { $gte: thirtyDaysAgo } };
  if (scopedIds !== null) attQuery.employee = { $in: scopedIds };

  const attendanceStats = await Attendance.aggregate([
    { $match: attQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const attMap = { present: 0, absent: 0, late: 0, 'half-day': 0 };
  let totalAttRecords = 0;
  attendanceStats.forEach((s) => {
    if (attMap[s._id] !== undefined) attMap[s._id] = s.count;
    totalAttRecords += s.count;
  });
  const attendanceRate = totalAttRecords > 0
    ? Math.round(((attMap.present + attMap['half-day'] * 0.5) / totalAttRecords) * 100)
    : 0;

  // Leave stats
  const leaveQuery = {};
  if (scopedIds !== null) leaveQuery.employee = { $in: scopedIds };
  const leaveStats = await Leave.aggregate([
    { $match: leaveQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const leaveMap = { pending: 0, approved: 0, rejected: 0 };
  leaveStats.forEach((s) => {
    if (leaveMap[s._id] !== undefined) leaveMap[s._id] = s.count;
  });

  // Performance stats
  const perfQuery = {};
  if (scopedIds !== null) perfQuery.employee = { $in: scopedIds };
  const perfReviews = await PerformanceReview.aggregate([
    { $match: perfQuery },
    { $group: { _id: null, avgRating: { $avg: '$overallRating' }, count: { $sum: 1 } } },
  ]);
  const avgPerformanceRating = perfReviews.length > 0 && perfReviews[0].avgRating
    ? Math.round(perfReviews[0].avgRating * 10) / 10
    : null;

  // Payroll summary (Admin & HR only, or personal total for Employee)
  let payrollTotal = 0;
  if (role === 'admin' || role === 'hr') {
    const payrollAgg = await Payroll.aggregate([
      { $group: { _id: null, totalGross: { $sum: '$grossSalary' }, totalNet: { $sum: '$netSalary' } } },
    ]);
    payrollTotal = payrollAgg.length > 0 ? payrollAgg[0].totalNet : 0;
  } else if (role === 'employee' && scopedIds && scopedIds.length > 0) {
    const myPayroll = await Payroll.aggregate([
      { $match: { employee: scopedIds[0] } },
      { $group: { _id: null, totalNet: { $sum: '$netSalary' } } },
    ]);
    payrollTotal = myPayroll.length > 0 ? myPayroll[0].totalNet : 0;
  }

  // Recruitment summary (Admin & HR only)
  let recruitmentSummary = null;
  if (role === 'admin' || role === 'hr') {
    const [openJobs, totalCandidates, activeApps] = await Promise.all([
      JobOpening.countDocuments({ status: 'published' }),
      Candidate.countDocuments(),
      JobApplication.countDocuments({ currentStage: { $nin: ['Hired', 'Rejected'] } }),
    ]);
    recruitmentSummary = { openJobs, totalCandidates, activeApps };
  }

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: totalEmployees - activeEmployees,
      departmentsCount,
    },
    attendance: {
      attendanceRate,
      ...attMap,
      totalLogs: totalAttRecords,
    },
    leave: leaveMap,
    performance: {
      avgRating: avgPerformanceRating,
      totalEvaluations: perfReviews[0]?.count || 0,
    },
    payroll: {
      totalNetExpenditure: payrollTotal,
    },
    recruitment: recruitmentSummary,
  };
};

/**
 * GET /api/reports/employees
 */
const getEmployeesReport = async ({ user, departmentId, status, employmentType }) => {
  const scopedIds = await getScopedEmployeeIds(user);
  const match = { isDeleted: { $ne: true } };

  if (scopedIds !== null) {
    match._id = { $in: scopedIds };
  }
  if (departmentId) {
    match.department = new mongoose.Types.ObjectId(departmentId);
  }
  if (status) match.status = status;
  if (employmentType) match.employmentType = employmentType;

  // Breakdown by Department
  const byDepartment = await Employee.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'deptInfo',
      },
    },
    { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        departmentName: { $ifNull: ['$deptInfo.name', 'Unassigned'] },
        count: 1,
        active: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Breakdown by Employment Type
  const byType = await Employee.aggregate([
    { $match: match },
    { $group: { _id: '$employmentType', count: { $sum: 1 } } },
  ]);

  // Breakdown by Status
  const byStatus = await Employee.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Recent Joiners List (top 10)
  const recentJoiners = await Employee.find(match)
    .select('employeeId firstName lastName designation department joiningDate status employmentType')
    .populate('department', 'name')
    .sort({ joiningDate: -1 })
    .limit(10)
    .lean();

  const total = await Employee.countDocuments(match);

  return {
    total,
    byDepartment,
    byEmploymentType: byType.map((t) => ({ type: t._id || 'other', count: t.count })),
    byStatus: byStatus.map((s) => ({ status: s._id || 'unknown', count: s.count })),
    recentJoiners,
  };
};

/**
 * GET /api/reports/attendance
 */
const getAttendanceReport = async ({ user, startDate, endDate, departmentId }) => {
  const scopedIds = await getScopedEmployeeIds(user);
  const match = {};

  if (scopedIds !== null) {
    match.employee = { $in: scopedIds };
  }

  const dateRange = buildDateRange(startDate, endDate);
  if (dateRange) {
    match.date = dateRange;
  } else {
    // Default past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    match.date = { $gte: thirtyDaysAgo };
  }

  // If department filter requested, filter employees in department
  if (departmentId) {
    const deptEmployees = await Employee.find({
      department: departmentId,
      isDeleted: { $ne: true },
    }).select('_id');
    const deptEmpIds = deptEmployees.map((e) => e._id);
    if (match.employee) {
      match.employee.$in = match.employee.$in.filter((id) =>
        deptEmpIds.some((dId) => dId.equals(id))
      );
    } else {
      match.employee = { $in: deptEmpIds };
    }
  }

  // 1. Overall Status Breakdown
  const statusStats = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, totalHours: { $sum: '$workHours' } } },
  ]);

  const summary = { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 };
  let totalRecords = 0;
  statusStats.forEach((s) => {
    if (summary[s._id] !== undefined) summary[s._id] = s.count;
    summary.totalHours += s.totalHours || 0;
    totalRecords += s.count;
  });
  summary.totalRecords = totalRecords;
  summary.attendancePercentage = totalRecords > 0
    ? Math.round(((summary.present + summary['half-day'] * 0.5) / totalRecords) * 100)
    : 0;

  // 2. Daily Trends
  const dailyTrends = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        present: 1,
        absent: 1,
        late: 1,
        halfDay: 1,
        total: 1,
        _id: 0,
      },
    },
  ]);

  // 3. Department Attendance (Admin/HR/Manager)
  const departmentAttendance = await Attendance.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'emp',
      },
    },
    { $unwind: '$emp' },
    {
      $lookup: {
        from: 'departments',
        localField: 'emp.department',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$dept.name', 'Unassigned'] },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        department: '$_id',
        present: 1,
        absent: 1,
        late: 1,
        total: 1,
        complianceRate: {
          $cond: [
            { $gt: ['$total', 0] },
            { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
            0,
          ],
        },
        _id: 0,
      },
    },
    { $sort: { complianceRate: -1 } },
  ]);

  return {
    summary,
    dailyTrends,
    departmentAttendance,
  };
};

/**
 * GET /api/reports/leave
 */
const getLeaveReport = async ({ user, startDate, endDate, departmentId, status }) => {
  const scopedIds = await getScopedEmployeeIds(user);
  const match = {};

  if (scopedIds !== null) {
    match.employee = { $in: scopedIds };
  }
  if (status) match.status = status;

  const dateRange = buildDateRange(startDate, endDate);
  if (dateRange) {
    match.startDate = dateRange;
  }

  if (departmentId) {
    const deptEmployees = await Employee.find({
      department: departmentId,
      isDeleted: { $ne: true },
    }).select('_id');
    const deptEmpIds = deptEmployees.map((e) => e._id);
    if (match.employee) {
      match.employee.$in = match.employee.$in.filter((id) =>
        deptEmpIds.some((dId) => dId.equals(id))
      );
    } else {
      match.employee = { $in: deptEmpIds };
    }
  }

  // 1. Status Breakdown
  const statusAgg = await Leave.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 }, totalDays: { $sum: '$numberOfDays' } } },
  ]);

  const summary = { pending: 0, approved: 0, rejected: 0, cancelled: 0, totalDaysApproved: 0 };
  let totalRequests = 0;
  statusAgg.forEach((s) => {
    if (summary[s._id] !== undefined) summary[s._id] = s.count;
    if (s._id === 'approved') summary.totalDaysApproved = s.totalDays || 0;
    totalRequests += s.count;
  });
  summary.totalRequests = totalRequests;

  // 2. Breakdown by Leave Type
  const byType = await Leave.aggregate([
    { $match: match },
    { $group: { _id: '$leaveType', count: { $sum: 1 }, totalDays: { $sum: '$numberOfDays' } } },
    { $project: { leaveType: '$_id', count: 1, totalDays: 1, _id: 0 } },
    { $sort: { totalDays: -1 } },
  ]);

  // 3. Monthly Leave Trends
  const monthlyTrends = await Leave.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$numberOfDays', 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$numberOfDays', 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$numberOfDays', 0] } },
        totalRequests: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: '$_id',
        approvedDays: '$approved',
        pendingDays: '$pending',
        rejectedDays: '$rejected',
        totalRequests: 1,
        _id: 0,
      },
    },
  ]);

  return {
    summary,
    byType,
    monthlyTrends,
  };
};

/**
 * GET /api/reports/payroll
 * Role restriction:
 * - Admin/HR: Full org payroll trends, department expenditures, status
 * - Manager: 403 Forbidden (Managers do not have organizational payroll access)
 * - Employee: Personal payroll history only
 */
const getPayrollReport = async ({ user, year }) => {
  const role = (user.role || '').toLowerCase();

  if (role === 'manager') {
    throw new Error('Managers are not authorized to view organizational payroll reports.');
  }

  const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const match = { 'payPeriod.year': currentYear };

  if (role === 'employee') {
    const emp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    if (!emp) {
      return { summary: { totalNet: 0, recordsCount: 0 }, monthlyTrends: [] };
    }
    match.employee = emp._id;
  }

  // Summary
  const summaryAgg = await Payroll.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalGross: { $sum: '$grossSalary' },
        totalNet: { $sum: '$netSalary' },
        totalDeductions: { $sum: '$totalDeductions' },
      },
    },
  ]);

  const summary = {
    totalGross: 0,
    totalNet: 0,
    totalDeductions: 0,
    paidRecords: 0,
    pendingRecords: 0,
    totalRecords: 0,
  };

  summaryAgg.forEach((s) => {
    summary.totalGross += s.totalGross || 0;
    summary.totalNet += s.totalNet || 0;
    summary.totalDeductions += s.totalDeductions || 0;
    summary.totalRecords += s.count;
    if (s._id === 'paid') summary.paidRecords += s.count;
    if (s._id === 'pending' || s._id === 'processing') summary.pendingRecords += s.count;
  });

  // Monthly trends (Months 1-12)
  const monthlyTrends = await Payroll.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$payPeriod.month',
        gross: { $sum: '$grossSalary' },
        net: { $sum: '$netSalary' },
        deductions: { $sum: '$totalDeductions' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: '$_id',
        gross: 1,
        net: 1,
        deductions: 1,
        count: 1,
        _id: 0,
      },
    },
  ]);

  // Department Breakdown (Admin/HR only)
  let byDepartment = [];
  if (role === 'admin' || role === 'hr') {
    byDepartment = await Payroll.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'emp',
        },
      },
      { $unwind: '$emp' },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.department',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$dept.name', 'General'] },
          totalNet: { $sum: '$netSalary' },
          totalGross: { $sum: '$grossSalary' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          department: '$_id',
          totalNet: 1,
          totalGross: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { totalNet: -1 } },
    ]);
  }

  return {
    year: currentYear,
    summary,
    monthlyTrends,
    byDepartment,
  };
};

/**
 * GET /api/reports/performance
 */
const getPerformanceReport = async ({ user, cycleId, departmentId }) => {
  const scopedIds = await getScopedEmployeeIds(user);
  const match = {};

  if (scopedIds !== null) {
    match.employee = { $in: scopedIds };
  }
  if (cycleId) {
    match.reviewCycle = new mongoose.Types.ObjectId(cycleId);
  }

  if (departmentId) {
    const deptEmployees = await Employee.find({
      department: departmentId,
      isDeleted: { $ne: true },
    }).select('_id');
    const deptEmpIds = deptEmployees.map((e) => e._id);
    if (match.employee) {
      match.employee.$in = match.employee.$in.filter((id) =>
        deptEmpIds.some((dId) => dId.equals(id))
      );
    } else {
      match.employee = { $in: deptEmpIds };
    }
  }

  // 1. Rating Distribution (1 to 5)
  const ratings = await PerformanceReview.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $round: ['$overallRating', 0] },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ratingMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumRatings = 0;
  let totalReviews = 0;
  ratings.forEach((r) => {
    if (ratingMap[r._id] !== undefined) ratingMap[r._id] = r.count;
    sumRatings += r._id * r.count;
    totalReviews += r.count;
  });

  const avgRating = totalReviews > 0 ? Math.round((sumRatings / totalReviews) * 10) / 10 : 0;

  // 2. Goal completion stats
  const goalMatch = {};
  if (scopedIds !== null) goalMatch.employee = { $in: scopedIds };

  const goalStats = await EmployeeGoal.aggregate([
    { $match: goalMatch },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProgress: { $avg: '$progress' },
      },
    },
  ]);

  let totalGoals = 0;
  let completedGoals = 0;
  let inProgressGoals = 0;
  let progressSum = 0;

  goalStats.forEach((g) => {
    totalGoals += g.count;
    progressSum += (g.avgProgress || 0) * g.count;
    if (g._id === 'completed') completedGoals += g.count;
    if (g._id === 'in_progress') inProgressGoals += g.count;
  });

  const overallGoalProgress = totalGoals > 0 ? Math.round(progressSum / totalGoals) : 0;

  // 3. Recent Reviews
  const recentReviews = await PerformanceReview.find(match)
    .populate('employee', 'firstName lastName employeeId designation')
    .populate('reviewer', 'name email role')
    .populate('reviewCycle', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    overview: {
      totalReviews,
      avgRating,
      ratingDistribution: Object.keys(ratingMap).map((stars) => ({
        stars: Number(stars),
        count: ratingMap[stars],
      })),
    },
    goals: {
      totalGoals,
      completedGoals,
      inProgressGoals,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      overallProgressPercentage: overallGoalProgress,
    },
    recentReviews,
  };
};

/**
 * GET /api/reports/recruitment
 * Admin/HR exclusive.
 */
const getRecruitmentReport = async ({ user, startDate, endDate }) => {
  const role = (user.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'hr') {
    throw new Error('Access denied: Recruitment reports are restricted to Admin and HR.');
  }

  const [openJobs, totalCandidates, totalApplications, hiredCount] = await Promise.all([
    JobOpening.countDocuments({ status: 'published' }),
    Candidate.countDocuments(),
    JobApplication.countDocuments(),
    JobApplication.countDocuments({ currentStage: 'Hired' }),
  ]);

  // Funnel: stage counts
  const stageOrder = [
    'Applied',
    'Screening',
    'Shortlisted',
    'Interview',
    'Selected',
    'Offer',
    'Hired',
    'Rejected',
  ];

  const stageAgg = await JobApplication.aggregate([
    { $group: { _id: '$currentStage', count: { $sum: 1 } } },
  ]);

  const stageCounts = {};
  stageOrder.forEach((st) => (stageCounts[st] = 0));
  stageAgg.forEach((s) => {
    if (stageCounts[s._id] !== undefined) stageCounts[s._id] = s.count;
  });

  const funnel = stageOrder.map((stage) => ({
    stage,
    count: stageCounts[stage],
  }));

  // Sourcing Channel breakdown
  const sourceAgg = await Candidate.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $project: { channel: { $ifNull: ['$_id', 'Direct'] }, count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);

  const hiringRate = totalApplications > 0
    ? Math.round((hiredCount / totalApplications) * 100)
    : 0;

  return {
    metrics: {
      openJobs,
      totalCandidates,
      totalApplications,
      hiredCount,
      hiringRate,
    },
    funnel,
    sourcingChannels: sourceAgg,
  };
};

/**
 * Generates RFC 4180 compliant CSV string from tabular array data.
 */
const generateCsv = (headers, rows) => {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};

module.exports = {
  getOverviewReport,
  getEmployeesReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getPerformanceReport,
  getRecruitmentReport,
  generateCsv,
};
