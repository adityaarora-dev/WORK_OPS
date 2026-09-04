const mongoose = require('mongoose');
const { PerformanceReviewCycle, CYCLE_STATUSES } = require('../models/PerformanceReviewCycle');
const { EmployeeGoal, GOAL_PRIORITIES, GOAL_STATUSES } = require('../models/EmployeeGoal');
const { PerformanceReview, REVIEW_STATUSES, RATING_LABELS } = require('../models/PerformanceReview');
const { Employee } = require('../models/Employee');

/**
 * Resolves the Employee document corresponding to the authenticated User.
 */
const resolveEmployeeForUser = async (user) => {
  if (!user) return null;
  return Employee.findOne({
    $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
  }).lean();
};

/**
 * Resolves team employee IDs reporting to a manager (including manager's own employee ID).
 */
const getManagerTeamIds = async (managerEmployeeId) => {
  const directReports = await Employee.find({
    $or: [{ manager: managerEmployeeId }, { _id: managerEmployeeId }],
  })
    .select('_id')
    .lean();

  return directReports.map((e) => e._id);
};

// ============================================================================
// 1. PERFORMANCE REVIEW CYCLES
// ============================================================================

const getCycles = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user?.role || '').toLowerCase();

  // Non-Admin/HR users should only view published cycles (not drafts)
  if (!['admin', 'hr'].includes(userRole)) {
    filter.status = { $ne: 'draft' };
  }

  if (query.status && query.status.trim() !== '') {
    filter.status = query.status.trim().toLowerCase();
  }

  const [total, cycles] = await Promise.all([
    PerformanceReviewCycle.countDocuments(filter),
    PerformanceReviewCycle.find(filter)
      .populate('createdBy', 'firstName lastName email role')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    cycles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getCycleById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid Review Cycle ID format.');
    error.status = 400;
    throw error;
  }

  const cycle = await PerformanceReviewCycle.findById(id)
    .populate('createdBy', 'firstName lastName email role')
    .lean();

  if (!cycle) {
    const error = new Error('Performance Review Cycle not found.');
    error.status = 404;
    throw error;
  }

  return cycle;
};

const createCycle = async ({ user, data }) => {
  const { name, description, startDate, endDate, status } = data;

  if (!name || !name.trim()) {
    const error = new Error('Cycle name is required.');
    error.status = 400;
    throw error;
  }

  if (!startDate || !endDate) {
    const error = new Error('Start date and end date are both required.');
    error.status = 400;
    throw error;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const error = new Error('Invalid date values provided for review cycle.');
    error.status = 400;
    throw error;
  }

  if (start > end) {
    const error = new Error('Start date cannot be after end date.');
    error.status = 400;
    throw error;
  }

  const existing = await PerformanceReviewCycle.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
  });

  if (existing) {
    const error = new Error(`A review cycle named "${name}" already exists.`);
    error.status = 409;
    throw error;
  }

  const cycle = await PerformanceReviewCycle.create({
    name: name.trim(),
    description: (description || '').trim(),
    startDate: start,
    endDate: end,
    status: status && CYCLE_STATUSES.includes(status) ? status : 'active',
    createdBy: user._id,
  });

  return cycle;
};

const updateCycle = async ({ id, user, data }) => {
  const cycle = await PerformanceReviewCycle.findById(id);
  if (!cycle) {
    const error = new Error('Performance Review Cycle not found.');
    error.status = 404;
    throw error;
  }

  if (data.name && data.name.trim() !== cycle.name) {
    const duplicate = await PerformanceReviewCycle.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    });
    if (duplicate) {
      const error = new Error(`A review cycle named "${data.name}" already exists.`);
      error.status = 409;
      throw error;
    }
    cycle.name = data.name.trim();
  }

  if (data.description !== undefined) cycle.description = (data.description || '').trim();

  if (data.startDate) {
    const start = new Date(data.startDate);
    if (isNaN(start.getTime())) {
      const error = new Error('Invalid start date.');
      error.status = 400;
      throw error;
    }
    cycle.startDate = start;
  }

  if (data.endDate) {
    const end = new Date(data.endDate);
    if (isNaN(end.getTime())) {
      const error = new Error('Invalid end date.');
      error.status = 400;
      throw error;
    }
    cycle.endDate = end;
  }

  if (cycle.startDate > cycle.endDate) {
    const error = new Error('Start date cannot be after end date.');
    error.status = 400;
    throw error;
  }

  if (data.status) {
    if (!CYCLE_STATUSES.includes(data.status)) {
      const error = new Error(`Invalid cycle status. Allowed: ${CYCLE_STATUSES.join(', ')}`);
      error.status = 400;
      throw error;
    }
    cycle.status = data.status;
  }

  await cycle.save();
  return cycle;
};

// ============================================================================
// 2. EMPLOYEE GOALS
// ============================================================================

const getGoals = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user?.role || '').toLowerCase();

  // Resource Scoping
  if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp) {
      return { goals: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const teamIds = await getManagerTeamIds(currentEmp._id);
    filter.employee = { $in: teamIds };
  } else if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp) {
      return { goals: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.employee = currentEmp._id;
  }

  // Explicit filters
  if (query.employee && ['admin', 'hr', 'manager'].includes(userRole)) {
    if (mongoose.Types.ObjectId.isValid(query.employee)) {
      if (userRole === 'manager') {
        const currentEmp = await resolveEmployeeForUser(user);
        const teamIds = (await getManagerTeamIds(currentEmp._id)).map((id) => id.toString());
        if (!teamIds.includes(query.employee)) {
          const error = new Error('Forbidden: You can only view goals for your assigned team members.');
          error.status = 403;
          throw error;
        }
      }
      filter.employee = query.employee;
    }
  }

  if (query.reviewCycle && mongoose.Types.ObjectId.isValid(query.reviewCycle)) {
    filter.reviewCycle = query.reviewCycle;
  }

  if (query.status && GOAL_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.priority && GOAL_PRIORITIES.includes(query.priority)) {
    filter.priority = query.priority;
  }

  const [total, goals] = await Promise.all([
    EmployeeGoal.countDocuments(filter),
    EmployeeGoal.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName email designation department manager',
        populate: { path: 'department', select: 'name code' },
      })
      .populate('assignedBy', 'firstName lastName email role')
      .populate('reviewCycle', 'name status startDate endDate')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    goals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getGoalById = async ({ id, user }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid Goal ID format.');
    error.status = 400;
    throw error;
  }

  const goal = await EmployeeGoal.findById(id)
    .populate({
      path: 'employee',
      select: 'employeeId firstName lastName email designation department manager',
      populate: { path: 'department', select: 'name code' },
    })
    .populate('assignedBy', 'firstName lastName email role')
    .populate('reviewCycle', 'name status startDate endDate')
    .lean();

  if (!goal) {
    const error = new Error('Goal not found.');
    error.status = 404;
    throw error;
  }

  // Check authorization
  const userRole = (user?.role || '').toLowerCase();
  if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp || goal.employee._id.toString() !== currentEmp._id.toString()) {
      const error = new Error('Forbidden: You can only access your own performance goals.');
      error.status = 403;
      throw error;
    }
  } else if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    const teamIds = (await getManagerTeamIds(currentEmp._id)).map((t) => t.toString());
    if (!teamIds.includes(goal.employee._id.toString())) {
      const error = new Error('Forbidden: You can only view goals for your assigned team members.');
      error.status = 403;
      throw error;
    }
  }

  return goal;
};

const createGoal = async ({ user, data }) => {
  const userRole = (user?.role || '').toLowerCase();
  const {
    employee,
    title,
    description,
    category,
    priority,
    startDate,
    dueDate,
    progress,
    status,
    reviewCycle,
  } = data;

  if (!title || !title.trim()) {
    const error = new Error('Goal title is required.');
    error.status = 400;
    throw error;
  }

  if (!dueDate) {
    const error = new Error('Goal due date is required.');
    error.status = 400;
    throw error;
  }

  // Target employee resolution
  let targetEmployeeId = employee;
  if (!targetEmployeeId && userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp) {
      const error = new Error('Employee profile not found.');
      error.status = 404;
      throw error;
    }
    targetEmployeeId = currentEmp._id;
  }

  if (!targetEmployeeId || !mongoose.Types.ObjectId.isValid(targetEmployeeId)) {
    const error = new Error('Valid target employee ID is required.');
    error.status = 400;
    throw error;
  }

  const targetEmployee = await Employee.findById(targetEmployeeId);
  if (!targetEmployee) {
    const error = new Error('Target employee record does not exist.');
    error.status = 404;
    throw error;
  }

  // Authorization check for manager
  if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    const teamIds = (await getManagerTeamIds(currentEmp._id)).map((t) => t.toString());
    if (!teamIds.includes(targetEmployeeId.toString())) {
      const error = new Error('Forbidden: Managers can only set goals for direct reports.');
      error.status = 403;
      throw error;
    }
  } else if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (targetEmployeeId.toString() !== currentEmp._id.toString()) {
      const error = new Error('Forbidden: Employees cannot assign goals to other employees.');
      error.status = 403;
      throw error;
    }
  }

  // Validate progress if given
  let goalProgress = 0;
  if (progress !== undefined) {
    const num = Number(progress);
    if (isNaN(num) || num < 0 || num > 100) {
      const error = new Error('Goal progress must be a number between 0 and 100.');
      error.status = 400;
      throw error;
    }
    goalProgress = num;
  }

  // Validate review cycle if provided
  let cycleId = null;
  if (reviewCycle) {
    if (!mongoose.Types.ObjectId.isValid(reviewCycle)) {
      const error = new Error('Invalid review cycle ID.');
      error.status = 400;
      throw error;
    }
    const cycle = await PerformanceReviewCycle.findById(reviewCycle);
    if (!cycle) {
      const error = new Error('Review cycle does not exist.');
      error.status = 404;
      throw error;
    }
    cycleId = cycle._id;
  }

  const goal = await EmployeeGoal.create({
    employee: targetEmployee._id,
    title: title.trim(),
    description: (description || '').trim(),
    category: (category || 'General').trim(),
    priority: priority && GOAL_PRIORITIES.includes(priority) ? priority : 'medium',
    startDate: startDate ? new Date(startDate) : new Date(),
    dueDate: new Date(dueDate),
    progress: goalProgress,
    status: status && GOAL_STATUSES.includes(status) ? status : 'not_started',
    assignedBy: user._id,
    reviewCycle: cycleId,
  });

  return goal;
};

const updateGoal = async ({ id, user, data }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid Goal ID format.');
    error.status = 400;
    throw error;
  }

  const goal = await EmployeeGoal.findById(id);
  if (!goal) {
    const error = new Error('Goal not found.');
    error.status = 404;
    throw error;
  }

  const userRole = (user?.role || '').toLowerCase();

  // Validate authorization
  if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp || goal.employee.toString() !== currentEmp._id.toString()) {
      const error = new Error('Forbidden: You can only update your own goals.');
      error.status = 403;
      throw error;
    }

    // Employees can update progress and optionally status
    if (data.progress !== undefined) {
      const num = Number(data.progress);
      if (isNaN(num) || num < 0 || num > 100) {
        const error = new Error('Progress must be between 0 and 100.');
        error.status = 400;
        throw error;
      }
      goal.progress = num;
      if (num === 100) goal.status = 'completed';
      else if (num > 0 && goal.status === 'not_started') goal.status = 'in_progress';
    }

    if (data.status && GOAL_STATUSES.includes(data.status)) {
      goal.status = data.status;
    }

    await goal.save();
    return goal;
  }

  if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    const teamIds = (await getManagerTeamIds(currentEmp._id)).map((t) => t.toString());
    if (!teamIds.includes(goal.employee.toString())) {
      const error = new Error('Forbidden: You can only update goals for your assigned team members.');
      error.status = 403;
      throw error;
    }
  }

  // Admin / HR / Manager edits
  if (data.title && data.title.trim()) goal.title = data.title.trim();
  if (data.description !== undefined) goal.description = (data.description || '').trim();
  if (data.category) goal.category = data.category.trim();
  if (data.priority && GOAL_PRIORITIES.includes(data.priority)) goal.priority = data.priority;
  if (data.dueDate) goal.dueDate = new Date(data.dueDate);
  if (data.startDate) goal.startDate = new Date(data.startDate);

  if (data.progress !== undefined) {
    const num = Number(data.progress);
    if (isNaN(num) || num < 0 || num > 100) {
      const error = new Error('Progress must be between 0 and 100.');
      error.status = 400;
      throw error;
    }
    goal.progress = num;
    if (num === 100) goal.status = 'completed';
    else if (num > 0 && goal.status === 'not_started') goal.status = 'in_progress';
  }

  if (data.status && GOAL_STATUSES.includes(data.status)) {
    goal.status = data.status;
  }

  if (data.reviewCycle !== undefined) {
    if (data.reviewCycle === null || data.reviewCycle === '') {
      goal.reviewCycle = null;
    } else if (mongoose.Types.ObjectId.isValid(data.reviewCycle)) {
      goal.reviewCycle = data.reviewCycle;
    }
  }

  await goal.save();
  return goal;
};

// ============================================================================
// 3. PERFORMANCE REVIEWS
// ============================================================================

const getReviews = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user?.role || '').toLowerCase();

  // Resource Scoping
  if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp) {
      return { reviews: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const teamIds = await getManagerTeamIds(currentEmp._id);
    filter.$or = [{ employee: { $in: teamIds } }, { reviewer: user._id }];
  } else if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp) {
      return { reviews: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.employee = currentEmp._id;
    // Do not show draft reviews to employee until submitted
    filter.status = { $ne: 'draft' };
  }

  // Filter params
  if (query.reviewCycle && mongoose.Types.ObjectId.isValid(query.reviewCycle)) {
    filter.reviewCycle = query.reviewCycle;
  }

  if (query.status && REVIEW_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.employee && ['admin', 'hr', 'manager'].includes(userRole)) {
    if (mongoose.Types.ObjectId.isValid(query.employee)) {
      if (userRole === 'manager') {
        const currentEmp = await resolveEmployeeForUser(user);
        const teamIds = (await getManagerTeamIds(currentEmp._id)).map((t) => t.toString());
        if (!teamIds.includes(query.employee)) {
          const error = new Error('Forbidden: You can only view reviews for your assigned team members.');
          error.status = 403;
          throw error;
        }
      }
      filter.employee = query.employee;
    }
  }

  const [total, reviews] = await Promise.all([
    PerformanceReview.countDocuments(filter),
    PerformanceReview.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName email designation department manager',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'manager', select: 'firstName lastName employeeId' },
        ],
      })
      .populate('reviewer', 'firstName lastName email role')
      .populate('reviewCycle', 'name status startDate endDate')
      .sort({ reviewDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getReviewById = async ({ id, user }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid Review ID format.');
    error.status = 400;
    throw error;
  }

  const review = await PerformanceReview.findById(id)
    .populate({
      path: 'employee',
      select: 'employeeId firstName lastName email designation department manager',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'manager', select: 'firstName lastName employeeId' },
      ],
    })
    .populate('reviewer', 'firstName lastName email role')
    .populate('reviewCycle', 'name status startDate endDate')
    .lean();

  if (!review) {
    const error = new Error('Performance Review not found.');
    error.status = 404;
    throw error;
  }

  const userRole = (user?.role || '').toLowerCase();

  // Resource authorization check
  if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp || review.employee._id.toString() !== currentEmp._id.toString()) {
      const error = new Error('Forbidden: You can only view your own performance reviews.');
      error.status = 403;
      throw error;
    }
    if (review.status === 'draft') {
      const error = new Error('Review is currently in draft and not yet available.');
      error.status = 403;
      throw error;
    }
  } else if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    const teamIds = (await getManagerTeamIds(currentEmp._id)).map((t) => t.toString());
    const isReviewer = review.reviewer._id.toString() === user._id.toString();
    const isTeamMember = teamIds.includes(review.employee._id.toString());
    if (!isReviewer && !isTeamMember) {
      const error = new Error('Forbidden: You can only view reviews for your assigned team members.');
      error.status = 403;
      throw error;
    }
  }

  return review;
};

const createReview = async ({ user, data }) => {
  const userRole = (user?.role || '').toLowerCase();

  if (userRole === 'employee') {
    const error = new Error('Forbidden: Employees cannot create manager evaluations.');
    error.status = 403;
    throw error;
  }

  const {
    employee,
    reviewCycle,
    overallRating,
    strengths,
    weaknesses,
    achievements,
    areasForImprovement,
    managerComments,
    status,
  } = data;

  if (!employee || !mongoose.Types.ObjectId.isValid(employee)) {
    const error = new Error('Valid target employee reference is required.');
    error.status = 400;
    throw error;
  }

  if (!reviewCycle || !mongoose.Types.ObjectId.isValid(reviewCycle)) {
    const error = new Error('Valid review cycle reference is required.');
    error.status = 400;
    throw error;
  }

  // Validate rating
  const ratingNum = Number(overallRating);
  if (isNaN(ratingNum) || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    const error = new Error('Overall rating is required and must be an integer between 1 and 5.');
    error.status = 400;
    throw error;
  }

  // Verify target employee exists
  const targetEmployee = await Employee.findById(employee);
  if (!targetEmployee) {
    const error = new Error('Employee record not found.');
    error.status = 404;
    throw error;
  }

  // Check manager permission: MUST be manager of that employee
  if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp) {
      const error = new Error('Manager employee record not found.');
      error.status = 403;
      throw error;
    }

    const isDirectReport =
      targetEmployee.manager &&
      targetEmployee.manager.toString() === currentEmp._id.toString();

    if (!isDirectReport) {
      const error = new Error('Forbidden: Managers can only conduct performance reviews for their assigned team members.');
      error.status = 403;
      throw error;
    }
  }

  // Verify cycle exists
  const cycle = await PerformanceReviewCycle.findById(reviewCycle);
  if (!cycle) {
    const error = new Error('Review cycle does not exist.');
    error.status = 404;
    throw error;
  }

  // Prevent duplicate review for the same employee in the same cycle
  const duplicate = await PerformanceReview.findOne({
    employee: targetEmployee._id,
    reviewCycle: cycle._id,
  });

  if (duplicate) {
    const error = new Error(`A performance review already exists for this employee in review cycle "${cycle.name}".`);
    error.status = 409;
    throw error;
  }

  const reviewStatus = status && REVIEW_STATUSES.includes(status) ? status : 'submitted';

  const review = await PerformanceReview.create({
    employee: targetEmployee._id,
    reviewer: user._id,
    reviewCycle: cycle._id,
    reviewDate: new Date(),
    overallRating: ratingNum,
    strengths: (strengths || '').trim(),
    weaknesses: (weaknesses || '').trim(),
    achievements: (achievements || '').trim(),
    areasForImprovement: (areasForImprovement || '').trim(),
    managerComments: (managerComments || '').trim(),
    employeeComments: '',
    status: reviewStatus,
  });

  return review;
};

const updateReview = async ({ id, user, data }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid Review ID format.');
    error.status = 400;
    throw error;
  }

  const review = await PerformanceReview.findById(id);
  if (!review) {
    const error = new Error('Performance Review not found.');
    error.status = 404;
    throw error;
  }

  const userRole = (user?.role || '').toLowerCase();

  // Employee workflow: Can acknowledge and add employeeComments
  if (userRole === 'employee') {
    const currentEmp = await resolveEmployeeForUser(user);
    if (!currentEmp || review.employee.toString() !== currentEmp._id.toString()) {
      const error = new Error('Forbidden: You can only acknowledge your own performance review.');
      error.status = 403;
      throw error;
    }

    // Security check: Employee cannot modify manager ratings or manager feedback!
    if (
      data.overallRating !== undefined ||
      data.strengths !== undefined ||
      data.weaknesses !== undefined ||
      data.achievements !== undefined ||
      data.areasForImprovement !== undefined ||
      data.managerComments !== undefined ||
      data.reviewer !== undefined
    ) {
      const error = new Error('Forbidden: Employees cannot modify manager ratings or review content.');
      error.status = 403;
      throw error;
    }

    if (review.status === 'draft') {
      const error = new Error('Cannot acknowledge a review that is still in draft.');
      error.status = 400;
      throw error;
    }

    if (data.employeeComments !== undefined) {
      review.employeeComments = (data.employeeComments || '').trim();
    }

    if (data.status === 'acknowledged' || data.acknowledge === true) {
      review.status = 'acknowledged';
    }

    await review.save();
    return review;
  }

  // Manager workflow: can edit review for assigned team members, unless already acknowledged
  if (userRole === 'manager') {
    const currentEmp = await resolveEmployeeForUser(user);
    const teamIds = (await getManagerTeamIds(currentEmp._id)).map((t) => t.toString());
    const isReviewer = review.reviewer.toString() === user._id.toString();
    const isTeamMember = teamIds.includes(review.employee.toString());

    if (!isReviewer && !isTeamMember) {
      const error = new Error('Forbidden: You can only edit reviews for your assigned team members.');
      error.status = 403;
      throw error;
    }

    if (review.status === 'acknowledged') {
      const error = new Error('Invalid state transition: A review acknowledged by the employee cannot be modified.');
      error.status = 400;
      throw error;
    }
  }

  // Update fields for Admin / HR / Manager
  if (data.overallRating !== undefined) {
    const ratingNum = Number(data.overallRating);
    if (isNaN(ratingNum) || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      const error = new Error('Overall rating must be an integer between 1 and 5.');
      error.status = 400;
      throw error;
    }
    review.overallRating = ratingNum;
  }

  if (data.strengths !== undefined) review.strengths = (data.strengths || '').trim();
  if (data.weaknesses !== undefined) review.weaknesses = (data.weaknesses || '').trim();
  if (data.achievements !== undefined) review.achievements = (data.achievements || '').trim();
  if (data.areasForImprovement !== undefined) review.areasForImprovement = (data.areasForImprovement || '').trim();
  if (data.managerComments !== undefined) review.managerComments = (data.managerComments || '').trim();
  if (data.employeeComments !== undefined && ['admin', 'hr'].includes(userRole)) {
    review.employeeComments = (data.employeeComments || '').trim();
  }

  if (data.status) {
    if (!REVIEW_STATUSES.includes(data.status)) {
      const error = new Error(`Invalid review status. Allowed: ${REVIEW_STATUSES.join(', ')}`);
      error.status = 400;
      throw error;
    }
    review.status = data.status;
  }

  await review.save();
  return review;
};

// ============================================================================
// 4. EMPLOYEE SELF-SERVICE: GET /api/performance/my
// ============================================================================

const getMyPerformance = async ({ user }) => {
  const currentEmp = await resolveEmployeeForUser(user);
  if (!currentEmp) {
    const error = new Error('Employee profile not found for current user.');
    error.status = 404;
    throw error;
  }

  const [goals, reviews, activeCycles] = await Promise.all([
    EmployeeGoal.find({ employee: currentEmp._id })
      .populate('assignedBy', 'firstName lastName email role')
      .populate('reviewCycle', 'name status startDate endDate')
      .sort({ dueDate: 1 })
      .lean(),
    PerformanceReview.find({ employee: currentEmp._id, status: { $ne: 'draft' } })
      .populate('reviewer', 'firstName lastName email role')
      .populate('reviewCycle', 'name status startDate endDate')
      .sort({ reviewDate: -1 })
      .lean(),
    PerformanceReviewCycle.find({ status: 'active' }).sort({ endDate: 1 }).lean(),
  ]);

  // Aggregate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length;
  const avgProgress = totalGoals > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals) : 0;

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + (r.overallRating || 0), 0) / totalReviews).toFixed(1))
      : null;

  const pendingAcknowledgement = reviews.filter((r) => r.status === 'submitted').length;

  return {
    employee: {
      _id: currentEmp._id,
      employeeId: currentEmp.employeeId,
      fullName: `${currentEmp.firstName} ${currentEmp.lastName}`,
      designation: currentEmp.designation,
    },
    metrics: {
      totalGoals,
      completedGoals,
      inProgressGoals,
      avgProgress,
      totalReviews,
      avgRating,
      ratingLabel: avgRating ? RATING_LABELS[Math.round(avgRating)] : 'N/A',
      pendingAcknowledgement,
    },
    goals,
    reviews,
    activeCycles,
  };
};

module.exports = {
  resolveEmployeeForUser,
  getManagerTeamIds,
  // Cycles
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  // Goals
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  // Reviews
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  // My Performance
  getMyPerformance,
};
