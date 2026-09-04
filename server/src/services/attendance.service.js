const mongoose = require('mongoose');
const { Attendance } = require('../models/Attendance');
const { Employee } = require('../models/Employee');
const { Department } = require('../models/Department');

/**
 * Normalizes a date to midnight UTC for consistent per-day attendance grouping.
 */
const normalizeDate = (d) => {
  const date = d ? new Date(d) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

/**
 * Calculates work hours between two timestamps rounded to one decimal place.
 */
const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  if (outTime <= inTime) return 0;
  const hours = (outTime - inTime) / (1000 * 60 * 60);
  return Math.round(hours * 10) / 10;
};

/**
 * Retrieves role-scoped attendance logs with pagination and filters.
 */
const getAttendanceList = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user.role || '').toLowerCase();

  // Role Scoping
  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');

    if (!mgr) {
      return { records: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const teamEmployees = await Employee.find({
      $or: [{ manager: mgr._id }, { _id: mgr._id }],
    }).select('_id');

    filter.employee = { $in: teamEmployees.map((e) => e._id) };
  } else if (userRole === 'employee') {
    const emp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');

    if (!emp) {
      return { records: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.employee = emp._id;
  }

  // Filter by specific employee if allowed
  if (query.employee && query.employee.trim() !== '') {
    const empVal = query.employee.trim();
    if (mongoose.Types.ObjectId.isValid(empVal)) {
      if (!filter.employee || filter.employee.toString() === empVal) {
        filter.employee = empVal;
      }
    } else {
      const foundEmp = await Employee.findOne({ employeeId: empVal.toUpperCase() }).select('_id');
      if (foundEmp) {
        filter.employee = foundEmp._id;
      }
    }
  }

  // Filter by department
  if (query.department && query.department.trim() !== '') {
    let deptId = null;
    if (mongoose.Types.ObjectId.isValid(query.department.trim())) {
      deptId = query.department.trim();
    } else {
      const dept = await Department.findOne({
        name: new RegExp(`^${query.department.trim()}$`, 'i'),
      }).select('_id');
      if (dept) deptId = dept._id;
    }

    if (deptId) {
      const deptEmployees = await Employee.find({ department: deptId }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id);
      if (filter.employee && filter.employee.$in) {
        filter.employee = {
          $in: filter.employee.$in.filter((id) => deptEmpIds.some((dId) => dId.equals(id))),
        };
      } else if (!filter.employee) {
        filter.employee = { $in: deptEmpIds };
      }
    }
  }

  // Filter by status
  if (query.status && query.status.trim() !== '') {
    filter.status = query.status.trim().toLowerCase();
  }

  // Filter by date
  if (query.date) {
    const exactDate = normalizeDate(query.date);
    filter.date = exactDate;
  } else if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = normalizeDate(query.startDate);
    if (query.endDate) filter.date.$lte = normalizeDate(query.endDate);
  }

  const [total, records] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName email designation department',
        populate: { path: 'department', select: 'name departmentId' },
      })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    records,
    pagination: { page, limit, total, totalPages },
  };
};

/**
 * Returns attendance summary KPIs for today.
 */
const getAttendanceSummary = async ({ user }) => {
  const today = normalizeDate(new Date());
  const filter = { date: today };
  const userRole = (user.role || '').toLowerCase();

  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    if (mgr) {
      const teamEmployees = await Employee.find({
        $or: [{ manager: mgr._id }, { _id: mgr._id }],
      }).select('_id');
      filter.employee = { $in: teamEmployees.map((e) => e._id) };
    }
  } else if (userRole === 'employee') {
    const emp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    if (emp) filter.employee = emp._id;
  }

  const [present, absent, late, onLeave, total] = await Promise.all([
    Attendance.countDocuments({ ...filter, status: 'present' }),
    Attendance.countDocuments({ ...filter, status: 'absent' }),
    Attendance.countDocuments({ ...filter, status: 'late' }),
    Attendance.countDocuments({ ...filter, status: 'leave' }),
    Attendance.countDocuments(filter),
  ]);

  return {
    present,
    absent,
    late,
    onLeave,
    totalRecords: total,
    rate: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
  };
};

/**
 * Retrieves a single attendance record by ID with resource-level authorization.
 */
const getAttendanceById = async ({ user, id }) => {
  const record = await Attendance.findById(id)
    .populate({
      path: 'employee',
      select: 'employeeId firstName lastName email designation department manager user',
      populate: { path: 'department', select: 'name departmentId' },
    })
    .populate('markedBy', 'firstName lastName email role');

  if (!record) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'admin' || userRole === 'hr') {
    return record;
  }

  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    const isSelf = mgr && record.employee._id.equals(mgr._id);
    const isTeam = mgr && record.employee.manager && record.employee.manager.equals(mgr._id);
    if (!isSelf && !isTeam) {
      const err = new Error('Access Denied: You cannot view attendance for employees outside your team.');
      err.statusCode = 403;
      throw err;
    }
    return record;
  }

  if (userRole === 'employee') {
    const isSelfUser = record.employee.user && record.employee.user.equals(user._id);
    const isSelfEmpId = record.employee.employeeId === user.employeeId;
    if (!isSelfUser && !isSelfEmpId) {
      const err = new Error('Access Denied: You can only view your own attendance records.');
      err.statusCode = 403;
      throw err;
    }
    return record;
  }

  const err = new Error('Forbidden');
  err.statusCode = 403;
  throw err;
};

/**
 * Records attendance (clock in / admin entry).
 */
const recordAttendance = async ({ user, data }) => {
  const userRole = (user.role || '').toLowerCase();
  let employeeId = data.employee;

  // If role is employee, employee can only mark self
  if (userRole === 'employee') {
    const selfEmp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    if (!selfEmp) {
      const err = new Error('No employee profile associated with your user account.');
      err.statusCode = 400;
      throw err;
    }
    employeeId = selfEmp._id;
  } else {
    // Admin / HR / Manager can provide employee ID
    if (!employeeId) {
      const err = new Error('Employee ID is required');
      err.statusCode = 400;
      throw err;
    }
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const found = await Employee.findOne({ employeeId: employeeId.toUpperCase() }).select('_id');
      if (!found) {
        const err = new Error(`Employee not found with ID: ${employeeId}`);
        err.statusCode = 404;
        throw err;
      }
      employeeId = found._id;
    }
  }

  // Validate employee exists and is active
  const employeeDoc = await Employee.findById(employeeId);
  if (!employeeDoc) {
    const err = new Error('Employee record not found');
    err.statusCode = 404;
    throw err;
  }
  if (employeeDoc.employmentStatus === 'inactive' || employeeDoc.employmentStatus === 'terminated') {
    const err = new Error('Cannot record attendance for an inactive or terminated employee.');
    err.statusCode = 400;
    throw err;
  }

  const attendanceDate = normalizeDate(data.date);

  // Check unique compound constraint (employee + date)
  const existing = await Attendance.findOne({
    employee: employeeId,
    date: attendanceDate,
  });

  if (existing) {
    const err = new Error('Attendance record already exists for this employee on the specified date.');
    err.statusCode = 409;
    throw err;
  }

  const checkInTime = data.checkIn ? new Date(data.checkIn) : new Date();
  let checkOutTime = data.checkOut ? new Date(data.checkOut) : null;

  if (checkOutTime && checkOutTime < checkInTime) {
    const err = new Error('Check-out time cannot be earlier than check-in time.');
    err.statusCode = 400;
    throw err;
  }

  const workHours = calculateWorkHours(checkInTime, checkOutTime);

  const newRecord = await Attendance.create({
    employee: employeeId,
    date: attendanceDate,
    checkIn: checkInTime,
    checkOut: checkOutTime,
    status: data.status || 'present',
    workHours,
    remarks: (data.remarks || '').trim(),
    markedBy: user._id,
  });

  return newRecord;
};

/**
 * Updates attendance (clock out / admin correction).
 */
const updateAttendance = async ({ user, id, data }) => {
  const record = await Attendance.findById(id).populate('employee');
  if (!record) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();

  // If employee, can only clock out own record for today
  if (userRole === 'employee') {
    const isSelf = record.employee.user && record.employee.user.equals(user._id);
    if (!isSelf) {
      const err = new Error('Access Denied: You can only update your own attendance.');
      err.statusCode = 403;
      throw err;
    }
    // Only allow setting checkOut
    record.checkOut = data.checkOut ? new Date(data.checkOut) : new Date();
    if (record.checkOut < record.checkIn) {
      const err = new Error('Check-out time cannot be earlier than check-in time.');
      err.statusCode = 400;
      throw err;
    }
    record.workHours = calculateWorkHours(record.checkIn, record.checkOut);
    await record.save();
    return record;
  }

  if (userRole === 'manager') {
    const err = new Error('Forbidden: Managers cannot modify official attendance records.');
    err.statusCode = 403;
    throw err;
  }

  // Admin & HR can update fields
  if (data.status) record.status = data.status;
  if (data.checkIn) record.checkIn = new Date(data.checkIn);
  if (data.checkOut) record.checkOut = new Date(data.checkOut);
  if (data.remarks !== undefined) record.remarks = data.remarks.trim();

  if (record.checkIn && record.checkOut && record.checkOut < record.checkIn) {
    const err = new Error('Check-out time cannot be earlier than check-in time.');
    err.statusCode = 400;
    throw err;
  }

  record.workHours = calculateWorkHours(record.checkIn, record.checkOut);
  await record.save();

  return record;
};

module.exports = {
  getAttendanceList,
  getAttendanceSummary,
  getAttendanceById,
  recordAttendance,
  updateAttendance,
  normalizeDate,
  calculateWorkHours,
};
