const mongoose = require('mongoose');
const { Leave } = require('../models/Leave');
const { Employee } = require('../models/Employee');
const { logAuditEvent } = require('./audit.service');
const { createNotification } = require('./notification.service');

/**
 * Calculates inclusive calendar days between two dates.
 */
const calculateDays = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  s.setUTCHours(0, 0, 0, 0);
  e.setUTCHours(0, 0, 0, 0);
  const diffTime = e.getTime() - s.getTime();
  if (diffTime < 0) return 0;
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Retrieves paginated, filtered leave requests with role-based scoping.
 */
const getLeavesList = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user.role || '').toLowerCase();

  // Role scoping
  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');

    if (!mgr) {
      return { leaves: [], pagination: { page, limit, total: 0, totalPages: 0 } };
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
      return { leaves: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.employee = emp._id;
  }

  // Filter by status
  if (query.status && query.status.trim() !== '') {
    filter.status = query.status.trim().toLowerCase();
  }

  // Filter by leaveType
  if (query.leaveType && query.leaveType.trim() !== '') {
    filter.leaveType = query.leaveType.trim().toLowerCase();
  }

  const [total, leaves] = await Promise.all([
    Leave.countDocuments(filter),
    Leave.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName email designation department manager user',
        populate: { path: 'department', select: 'name departmentId' },
      })
      .populate('reviewedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    leaves,
    pagination: { page, limit, total, totalPages },
  };
};

/**
 * Returns summary counts for leave requests (pending, approved, rejected, cancelled).
 */
const getLeaveSummary = async ({ user }) => {
  const userRole = (user.role || '').toLowerCase();
  const filter = {};

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

  const [pending, approved, rejected, cancelled] = await Promise.all([
    Leave.countDocuments({ ...filter, status: 'pending' }),
    Leave.countDocuments({ ...filter, status: 'approved' }),
    Leave.countDocuments({ ...filter, status: 'rejected' }),
    Leave.countDocuments({ ...filter, status: 'cancelled' }),
  ]);

  return { pending, approved, rejected, cancelled };
};

/**
 * Retrieves a single leave request by ID with resource-level authorization.
 */
const getLeaveById = async ({ user, id }) => {
  const leave = await Leave.findById(id)
    .populate({
      path: 'employee',
      select: 'employeeId firstName lastName email designation department manager user',
      populate: { path: 'department', select: 'name departmentId' },
    })
    .populate('reviewedBy', 'firstName lastName email role');

  if (!leave) {
    const err = new Error('Leave request not found');
    err.statusCode = 404;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'admin' || userRole === 'hr') {
    return leave;
  }

  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    const isSelf = mgr && leave.employee._id.equals(mgr._id);
    const isTeam = mgr && leave.employee.manager && leave.employee.manager.equals(mgr._id);
    if (!isSelf && !isTeam) {
      const err = new Error('Access Denied: You can only view leave requests for your direct team.');
      err.statusCode = 403;
      throw err;
    }
    return leave;
  }

  if (userRole === 'employee') {
    const isSelfUser = leave.employee.user && leave.employee.user.equals(user._id);
    const isSelfEmpId = leave.employee.employeeId === user.employeeId;
    if (!isSelfUser && !isSelfEmpId) {
      const err = new Error('Access Denied: You can only view your own leave requests.');
      err.statusCode = 403;
      throw err;
    }
    return leave;
  }

  const err = new Error('Forbidden');
  err.statusCode = 403;
  throw err;
};

/**
 * Creates/applies for a leave request.
 */
const applyLeave = async ({ user, data }) => {
  const userRole = (user.role || '').toLowerCase();
  let employeeId = data.employee;

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
    if (!employeeId) {
      const selfEmp = await Employee.findOne({
        $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
      }).select('_id');
      employeeId = selfEmp ? selfEmp._id : null;
    } else if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      const found = await Employee.findOne({ employeeId: employeeId.toUpperCase() }).select('_id');
      if (found) employeeId = found._id;
    }
  }

  if (!employeeId) {
    const err = new Error('Employee reference is required.');
    err.statusCode = 400;
    throw err;
  }

  const employeeDoc = await Employee.findById(employeeId);
  if (!employeeDoc) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  if (employeeDoc.employmentStatus === 'inactive' || employeeDoc.employmentStatus === 'terminated') {
    const err = new Error('Cannot request leave for an inactive or terminated employee.');
    err.statusCode = 400;
    throw err;
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) {
    const err = new Error('End date cannot be earlier than start date.');
    err.statusCode = 400;
    throw err;
  }

  const numberOfDays = calculateDays(start, end);
  if (numberOfDays < 1) {
    const err = new Error('Leave must be at least 1 day.');
    err.statusCode = 400;
    throw err;
  }

  // Check overlapping active/pending leave requests
  const overlapping = await Leave.findOne({
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } },
    ],
  });

  if (overlapping) {
    const err = new Error(
      `Overlapping leave request already exists from ${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]} (Status: ${overlapping.status}).`
    );
    err.statusCode = 409;
    throw err;
  }

  const newLeave = await Leave.create({
    employee: employeeId,
    leaveType: data.leaveType || 'casual',
    startDate: start,
    endDate: end,
    numberOfDays,
    reason: (data.reason || '').trim(),
    status: 'pending',
  });

  // Audit log (non-blocking)
  logAuditEvent({
    actor: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LEAVE_APPLY',
    entityType: 'Leave',
    entityId: newLeave._id,
    description: `${employeeDoc.firstName} ${employeeDoc.lastName} applied for ${numberOfDays} days ${newLeave.leaveType} leave`,
    metadata: { leaveType: newLeave.leaveType, numberOfDays, startDate: start, endDate: end },
  });

  // Notify manager if manager has a linked user account
  if (employeeDoc.manager) {
    Employee.findById(employeeDoc.manager).select('user').then((mgrDoc) => {
      if (mgrDoc && mgrDoc.user) {
        createNotification({
          recipient: mgrDoc.user,
          type: 'leave',
          title: 'New Team Leave Request',
          message: `${employeeDoc.firstName} ${employeeDoc.lastName} requested ${numberOfDays} days of ${newLeave.leaveType} leave.`,
          relatedEntity: 'Leave',
          relatedEntityId: newLeave._id,
        });
      }
    }).catch(() => {});
  }

  return newLeave;
};

/**
 * Reviews a leave request (Approve or Reject).
 */
const reviewLeave = async ({ user, id, status, comment = '' }) => {
  const leave = await Leave.findById(id).populate('employee');
  if (!leave) {
    const err = new Error('Leave request not found');
    err.statusCode = 404;
    throw err;
  }

  if (leave.status === 'cancelled') {
    const err = new Error('Cannot review a cancelled leave request.');
    err.statusCode = 400;
    throw err;
  }

  if (leave.status === 'rejected') {
    const err = new Error('Cannot modify a rejected leave request.');
    err.statusCode = 400;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();

  // Rule: An employee cannot approve their own leave!
  if (leave.employee.user && leave.employee.user.equals(user._id)) {
    const err = new Error('Access Denied: You cannot approve or reject your own leave request.');
    err.statusCode = 403;
    throw err;
  }

  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    const isTeam = mgr && leave.employee.manager && leave.employee.manager.equals(mgr._id);
    if (!isTeam) {
      const err = new Error('Access Denied: You can only approve or reject leave requests for your direct team.');
      err.statusCode = 403;
      throw err;
    }
  } else if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Insufficient privileges to review leave requests.');
    err.statusCode = 403;
    throw err;
  }

  leave.status = status; // 'approved' or 'rejected'
  leave.reviewedBy = user._id;
  leave.reviewedAt = new Date();
  leave.reviewComment = comment.trim();

  await leave.save();

  // Audit log (non-blocking)
  logAuditEvent({
    actor: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: status === 'approved' ? 'LEAVE_APPROVE' : 'LEAVE_REJECT',
    entityType: 'Leave',
    entityId: leave._id,
    description: `Leave request for ${leave.employee?.firstName} ${leave.employee?.lastName} was ${status}`,
    metadata: { status, numberOfDays: leave.numberOfDays, comment: comment.trim() },
  });

  // Notify applicant employee
  if (leave.employee && leave.employee.user) {
    createNotification({
      recipient: leave.employee.user,
      type: 'leave',
      title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your leave request for ${leave.numberOfDays} days has been ${status}.${comment ? ` Note: "${comment}"` : ''}`,
      relatedEntity: 'Leave',
      relatedEntityId: leave._id,
    });
  }

  return leave;
};

/**
 * Cancels a pending leave request (by employee who applied or Admin/HR).
 */
const cancelLeave = async ({ user, id }) => {
  const leave = await Leave.findById(id).populate('employee');
  if (!leave) {
    const err = new Error('Leave request not found');
    err.statusCode = 404;
    throw err;
  }

  if (leave.status !== 'pending') {
    const err = new Error(`Only pending leave requests can be cancelled. Current status is "${leave.status}".`);
    err.statusCode = 400;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  const isOwner = leave.employee.user && leave.employee.user.equals(user._id);

  if (!isOwner && userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Access Denied: You can only cancel your own pending leave requests.');
    err.statusCode = 403;
    throw err;
  }

  leave.status = 'cancelled';
  await leave.save();
  return leave;
};

module.exports = {
  getLeavesList,
  getLeaveSummary,
  getLeaveById,
  applyLeave,
  reviewLeave,
  cancelLeave,
  calculateDays,
};
