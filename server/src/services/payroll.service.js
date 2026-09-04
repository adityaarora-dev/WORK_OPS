const mongoose = require('mongoose');
const { Payroll } = require('../models/Payroll');
const { Employee } = require('../models/Employee');
const { logAuditEvent } = require('./audit.service');
const { createNotification } = require('./notification.service');

/**
 * Computes Gross and Net salary values server-side.
 */
const computeSalary = ({ basicSalary = 0, allowances = 0, overtime = 0, bonus = 0, deductions = 0, tax = 0 }) => {
  const b = Math.max(0, Number(basicSalary) || 0);
  const a = Math.max(0, Number(allowances) || 0);
  const o = Math.max(0, Number(overtime) || 0);
  const bo = Math.max(0, Number(bonus) || 0);
  const d = Math.max(0, Number(deductions) || 0);
  const t = Math.max(0, Number(tax) || 0);

  const grossSalary = Math.round((b + a + o + bo) * 100) / 100;
  const netSalary = Math.round((grossSalary - d - t) * 100) / 100;

  return {
    basicSalary: b,
    allowances: a,
    overtime: o,
    bonus: bo,
    deductions: d,
    tax: t,
    grossSalary,
    netSalary,
  };
};

/**
 * Retrieves paginated payroll records with role authorization.
 */
const getPayrollList = async ({ user, query = {} }) => {
  const userRole = (user.role || '').toLowerCase();
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  // Role security enforcement
  if (userRole === 'manager') {
    // Sensitive financial protection: managers have restricted access to organization payroll
    return { records: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  } else if (userRole === 'employee') {
    const emp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');

    if (!emp) {
      return { records: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.employee = emp._id;
  }

  // Filters
  if (query.status && query.status.trim() !== '') {
    filter.paymentStatus = query.status.trim().toLowerCase();
  }

  if (query.month) {
    filter['payPeriod.month'] = parseInt(query.month, 10);
  }

  if (query.year) {
    filter['payPeriod.year'] = parseInt(query.year, 10);
  }

  if (query.employee && query.employee.trim() !== '') {
    const empVal = query.employee.trim();
    if (mongoose.Types.ObjectId.isValid(empVal)) {
      filter.employee = empVal;
    } else {
      const foundEmp = await Employee.findOne({ employeeId: empVal.toUpperCase() }).select('_id');
      if (foundEmp) filter.employee = foundEmp._id;
    }
  }

  const [total, records] = await Promise.all([
    Payroll.countDocuments(filter),
    Payroll.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName email designation department',
        populate: { path: 'department', select: 'name departmentId' },
      })
      .populate('processedBy', 'firstName lastName email role')
      .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1, createdAt: -1 })
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
 * Returns payroll summary metrics.
 */
const getPayrollSummary = async ({ user }) => {
  const userRole = (user.role || '').toLowerCase();
  const filter = {};

  if (userRole === 'employee') {
    const emp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    if (emp) filter.employee = emp._id;
  }

  const [totalPaid, pendingRecords, totalDisbursedAgg] = await Promise.all([
    Payroll.countDocuments({ ...filter, paymentStatus: 'paid' }),
    Payroll.countDocuments({ ...filter, paymentStatus: 'pending' }),
    Payroll.aggregate([
      { $match: { ...filter, paymentStatus: 'paid' } },
      { $group: { _id: null, totalNet: { $sum: '$netSalary' }, totalGross: { $sum: '$grossSalary' } } },
    ]),
  ]);

  const disbursed = totalDisbursedAgg[0]?.totalNet || 0;

  return {
    totalPaid,
    pendingRecords,
    totalDisbursed: Math.round(disbursed * 100) / 100,
  };
};

/**
 * Retrieves a single payroll record by ID with resource-level authorization.
 */
const getPayrollById = async ({ user, id }) => {
  const payroll = await Payroll.findById(id)
    .populate({
      path: 'employee',
      select: 'employeeId firstName lastName email designation department user manager',
      populate: { path: 'department', select: 'name departmentId' },
    })
    .populate('processedBy', 'firstName lastName email role');

  if (!payroll) {
    const err = new Error('Payroll record not found');
    err.statusCode = 404;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'admin' || userRole === 'hr') {
    return payroll;
  }

  if (userRole === 'employee') {
    const isSelfUser = payroll.employee.user && payroll.employee.user.equals(user._id);
    const isSelfEmpId = payroll.employee.employeeId === user.employeeId;
    if (!isSelfUser && !isSelfEmpId) {
      const err = new Error('Access Denied: You can only view your own payroll statements.');
      err.statusCode = 403;
      throw err;
    }
    return payroll;
  }

  const err = new Error('Forbidden: You do not have permission to view this financial record.');
  err.statusCode = 403;
  throw err;
};

/**
 * Creates a new payroll statement.
 * Allowed for ADMIN and HR only.
 */
const createPayroll = async ({ user, data }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can generate payroll.');
    err.statusCode = 403;
    throw err;
  }

  let employeeId = data.employee;
  if (!employeeId) {
    const err = new Error('Employee reference is required');
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

  const month = parseInt(data.payPeriod?.month || data.month, 10);
  const year = parseInt(data.payPeriod?.year || data.year, 10);

  if (!month || month < 1 || month > 12) {
    const err = new Error('Pay period month must be between 1 and 12.');
    err.statusCode = 400;
    throw err;
  }

  if (!year || year < 2000 || year > 2100) {
    const err = new Error('Invalid pay period year.');
    err.statusCode = 400;
    throw err;
  }

  // Check unique compound constraint: employee + month + year
  const existing = await Payroll.findOne({
    employee: employeeId,
    'payPeriod.month': month,
    'payPeriod.year': year,
  });

  if (existing) {
    const err = new Error(
      `Payroll record already exists for this employee for period ${month}/${year}.`
    );
    err.statusCode = 409;
    throw err;
  }

  const salary = computeSalary({
    basicSalary: data.basicSalary,
    allowances: data.allowances,
    overtime: data.overtime,
    bonus: data.bonus,
    deductions: data.deductions,
    tax: data.tax,
  });

  const paymentStatus = data.paymentStatus || 'pending';
  const paymentDate = paymentStatus === 'paid' ? (data.paymentDate ? new Date(data.paymentDate) : new Date()) : null;

  const newPayroll = await Payroll.create({
    employee: employeeId,
    payPeriod: { month, year },
    basicSalary: salary.basicSalary,
    allowances: salary.allowances,
    overtime: salary.overtime,
    bonus: salary.bonus,
    grossSalary: salary.grossSalary,
    deductions: salary.deductions,
    tax: salary.tax,
    netSalary: salary.netSalary,
    paymentStatus,
    paymentDate,
    paymentMethod: data.paymentMethod || 'direct-deposit',
    processedBy: user._id,
    remarks: (data.remarks || '').trim(),
  });

  // Audit log (non-blocking)
  logAuditEvent({
    actor: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'PAYROLL_GENERATE',
    entityType: 'Payroll',
    entityId: newPayroll._id,
    description: `Payroll processed for pay period ${month}/${year} (Net: INR ${salary.netSalary})`,
    metadata: { payPeriod: { month, year }, netSalary: salary.netSalary, grossSalary: salary.grossSalary },
  });

  // Notify employee if user account exists
  Employee.findById(employeeId).select('user firstName lastName').then((empDoc) => {
    if (empDoc && empDoc.user) {
      createNotification({
        recipient: empDoc.user,
        type: 'payroll',
        title: 'Monthly Pay Slip Generated',
        message: `Your pay slip for ${month}/${year} has been processed (Net Amount: INR ${salary.netSalary.toLocaleString()}).`,
        relatedEntity: 'Payroll',
        relatedEntityId: newPayroll._id,
      });
    }
  }).catch(() => {});

  return newPayroll;
};

/**
 * Updates an existing payroll record (status, payment date, payment method, remarks).
 * Allowed for ADMIN and HR only.
 */
const updatePayroll = async ({ user, id, data }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can modify payroll.');
    err.statusCode = 403;
    throw err;
  }

  const payroll = await Payroll.findById(id);
  if (!payroll) {
    const err = new Error('Payroll record not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.paymentStatus) {
    payroll.paymentStatus = data.paymentStatus;
    if (data.paymentStatus === 'paid' && !payroll.paymentDate) {
      payroll.paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    }
  }

  if (data.paymentMethod) payroll.paymentMethod = data.paymentMethod;
  if (data.remarks !== undefined) payroll.remarks = data.remarks.trim();

  // If financial amounts are updated, recompute server-side
  if (data.basicSalary !== undefined || data.allowances !== undefined || data.deductions !== undefined) {
    const salary = computeSalary({
      basicSalary: data.basicSalary !== undefined ? data.basicSalary : payroll.basicSalary,
      allowances: data.allowances !== undefined ? data.allowances : payroll.allowances,
      overtime: data.overtime !== undefined ? data.overtime : payroll.overtime,
      bonus: data.bonus !== undefined ? data.bonus : payroll.bonus,
      deductions: data.deductions !== undefined ? data.deductions : payroll.deductions,
      tax: data.tax !== undefined ? data.tax : payroll.tax,
    });

    payroll.basicSalary = salary.basicSalary;
    payroll.allowances = salary.allowances;
    payroll.overtime = salary.overtime;
    payroll.bonus = salary.bonus;
    payroll.grossSalary = salary.grossSalary;
    payroll.deductions = salary.deductions;
    payroll.tax = salary.tax;
    payroll.netSalary = salary.netSalary;
  }

  await payroll.save();
  return payroll;
};

module.exports = {
  getPayrollList,
  getPayrollSummary,
  getPayrollById,
  createPayroll,
  updatePayroll,
  computeSalary,
};
