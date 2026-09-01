const mongoose = require('mongoose');
const { Employee } = require('../models/Employee');
const { User } = require('../models/User');

/**
 * Generates the next sequential Employee ID (e.g. EMP001, EMP002).
 * Server-side generation prevents collision and invalid identifiers.
 *
 * @returns {Promise<string>}
 */
const generateNextEmployeeId = async () => {
  const lastEmployee = await Employee.findOne({ employeeId: /^EMP\d+$/i })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();

  if (!lastEmployee || !lastEmployee.employeeId) {
    return 'EMP001';
  }

  const match = lastEmployee.employeeId.match(/^EMP(\d+)$/i);
  if (!match) {
    return 'EMP001';
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `EMP${String(nextNum).padStart(3, '0')}`;
};

/**
 * Retrieves paginated, filtered, and role-scoped employees.
 *
 * @param {Object} options
 * @param {Object} options.user - Authenticated user identity
 * @param {Object} options.query - Express req.query
 */
const getEmployees = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  // Role-based scoping
  const userRole = (user.role || '').toLowerCase();

  if (userRole === 'manager') {
    // A manager can only view team members assigned to them
    const managerRecord = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');

    if (!managerRecord) {
      return {
        employees: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    // Include employees reporting to this manager, plus self
    filter.$or = [{ manager: managerRecord._id }, { _id: managerRecord._id }];
  } else if (userRole === 'employee') {
    // An employee can only view their own record
    filter.$or = [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }];
  }

  // Filters
  if (query.department && query.department.trim() !== '') {
    filter.department = { $regex: new RegExp(`^${query.department.trim()}$`, 'i') };
  }

  if (query.employmentStatus && query.employmentStatus.trim() !== '') {
    filter.employmentStatus = query.employmentStatus.trim().toLowerCase();
  }

  if (query.employmentType && query.employmentType.trim() !== '') {
    filter.employmentType = query.employmentType.trim().toLowerCase();
  }

  if (query.search && query.search.trim() !== '') {
    const s = query.search.trim();
    const searchRegex = new RegExp(s, 'i');
    const searchFilter = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { employeeId: searchRegex },
      { designation: searchRegex },
      { department: searchRegex },
    ];

    if (filter.$or) {
      // Must satisfy role scope AND search
      filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
      delete filter.$or;
    } else {
      filter.$or = searchFilter;
    }
  }

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [total, employees] = await Promise.all([
    Employee.countDocuments(filter),
    Employee.find(filter)
      .populate('manager', 'firstName lastName email employeeId designation')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    employees,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieves a single employee by MongoDB ObjectId or employeeId.
 * Enforces resource-level authorization.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {string} options.id - ObjectId or Employee ID
 */
const getEmployeeById = async ({ user, id }) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { employeeId: id.toUpperCase() };

  const employee = await Employee.findOne(query)
    .populate('manager', 'firstName lastName email employeeId designation')
    .populate('user', 'role isActive');

  if (!employee) {
    const err = new Error(`Employee not found with identifier: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  // Resource-level authorization
  const userRole = (user.role || '').toLowerCase();

  if (userRole === 'admin' || userRole === 'hr') {
    // Full access
    return employee;
  }

  if (userRole === 'manager') {
    const managerRecord = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');

    const isSelf = managerRecord && employee._id.equals(managerRecord._id);
    const isTeamMember =
      managerRecord && employee.manager && employee.manager._id.equals(managerRecord._id);

    if (!isSelf && !isTeamMember) {
      const err = new Error('Access Denied: You do not have permission to view this employee record.');
      err.statusCode = 403;
      throw err;
    }

    return employee;
  }

  if (userRole === 'employee') {
    const isSelfUser = employee.user && employee.user._id.equals(user._id);
    const isSelfEmpId = employee.employeeId === user.employeeId;
    const isSelfEmail = employee.email.toLowerCase() === user.email.toLowerCase();

    if (!isSelfUser && !isSelfEmpId && !isSelfEmail) {
      const err = new Error('Access Denied: Employees can only view their own employee profile.');
      err.statusCode = 403;
      throw err;
    }

    return employee;
  }

  const err = new Error('Forbidden resource access');
  err.statusCode = 403;
  throw err;
};

/**
 * Creates a new employee record.
 * Allowed for ADMIN and HR only.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {Object} options.data
 */
const createEmployee = async ({ user, data }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can create employees.');
    err.statusCode = 403;
    throw err;
  }

  const email = (data.email || '').trim().toLowerCase();
  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  // Check email uniqueness
  const existingEmail = await Employee.findOne({ email });
  if (existingEmail) {
    const err = new Error(`An employee with email "${email}" already exists.`);
    err.statusCode = 409;
    throw err;
  }

  // Generate or validate employeeId
  let employeeId = data.employeeId ? data.employeeId.trim().toUpperCase() : null;
  if (!employeeId) {
    employeeId = await generateNextEmployeeId();
  } else {
    const existingId = await Employee.findOne({ employeeId });
    if (existingId) {
      const err = new Error(`Employee ID "${employeeId}" is already assigned.`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Link to existing user if available
  let linkedUserId = data.user || null;
  if (!linkedUserId) {
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }],
    }).select('_id');
    if (existingUser) {
      linkedUserId = existingUser._id;
    }
  }

  // Validate manager if provided
  let managerId = null;
  if (data.manager && mongoose.Types.ObjectId.isValid(data.manager)) {
    const mgr = await Employee.findById(data.manager).select('_id');
    if (mgr) {
      managerId = mgr._id;
    }
  }

  const newEmployee = await Employee.create({
    employeeId,
    firstName: (data.firstName || '').trim(),
    lastName: (data.lastName || '').trim(),
    email,
    phone: (data.phone || '').trim(),
    alternatePhone: (data.alternatePhone || '').trim(),
    address: {
      street: data.address?.street?.trim() || '',
      city: data.address?.city?.trim() || '',
      state: data.address?.state?.trim() || '',
      postalCode: data.address?.postalCode?.trim() || '',
      country: data.address?.country?.trim() || 'United States',
    },
    department: (data.department || '').trim(),
    designation: (data.designation || '').trim(),
    employmentType: data.employmentType || 'full-time',
    joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    employmentStatus: data.employmentStatus || 'active',
    manager: managerId,
    user: linkedUserId,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    gender: data.gender || 'prefer-not-to-say',
    emergencyContact: {
      name: data.emergencyContact?.name?.trim() || '',
      phone: data.emergencyContact?.phone?.trim() || '',
      relationship: data.emergencyContact?.relationship?.trim() || '',
    },
    profileImage: data.profileImage || '',
  });

  return newEmployee;
};

/**
 * Updates an employee's administrative information.
 * Allowed for ADMIN and HR only.
 * Protects system/ownership fields.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {string} options.id
 * @param {Object} options.data
 */
const updateEmployee = async ({ user, id, data }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can update employees.');
    err.statusCode = 403;
    throw err;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { employeeId: id.toUpperCase() };

  const employee = await Employee.findOne(query);
  if (!employee) {
    const err = new Error(`Employee not found with identifier: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  // Check email collision if email is being updated
  if (data.email && data.email.trim().toLowerCase() !== employee.email) {
    const newEmail = data.email.trim().toLowerCase();
    const existing = await Employee.findOne({ email: newEmail });
    if (existing && !existing._id.equals(employee._id)) {
      const err = new Error(`Email "${newEmail}" is already in use by another employee.`);
      err.statusCode = 409;
      throw err;
    }
    employee.email = newEmail;
  }

  // Allowed editable fields
  if (data.firstName !== undefined) employee.firstName = data.firstName.trim();
  if (data.lastName !== undefined) employee.lastName = data.lastName.trim();
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.alternatePhone !== undefined) employee.alternatePhone = data.alternatePhone.trim();
  if (data.department !== undefined) employee.department = data.department.trim();
  if (data.designation !== undefined) employee.designation = data.designation.trim();
  if (data.employmentType !== undefined) employee.employmentType = data.employmentType;
  if (data.employmentStatus !== undefined) employee.employmentStatus = data.employmentStatus;
  if (data.joiningDate !== undefined) employee.joiningDate = new Date(data.joiningDate);
  if (data.dateOfBirth !== undefined) employee.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  if (data.gender !== undefined) employee.gender = data.gender;
  if (data.profileImage !== undefined) employee.profileImage = data.profileImage;

  if (data.manager !== undefined) {
    if (data.manager && mongoose.Types.ObjectId.isValid(data.manager)) {
      employee.manager = data.manager;
    } else {
      employee.manager = null;
    }
  }

  if (data.address) {
    employee.address = {
      street: data.address.street !== undefined ? data.address.street.trim() : employee.address.street,
      city: data.address.city !== undefined ? data.address.city.trim() : employee.address.city,
      state: data.address.state !== undefined ? data.address.state.trim() : employee.address.state,
      postalCode: data.address.postalCode !== undefined ? data.address.postalCode.trim() : employee.address.postalCode,
      country: data.address.country !== undefined ? data.address.country.trim() : employee.address.country,
    };
  }

  if (data.emergencyContact) {
    employee.emergencyContact = {
      name: data.emergencyContact.name !== undefined ? data.emergencyContact.name.trim() : employee.emergencyContact.name,
      phone: data.emergencyContact.phone !== undefined ? data.emergencyContact.phone.trim() : employee.emergencyContact.phone,
      relationship: data.emergencyContact.relationship !== undefined ? data.emergencyContact.relationship.trim() : employee.emergencyContact.relationship,
    };
  }

  await employee.save();
  return employee;
};

/**
 * Soft-deactivates an employee (sets employmentStatus: 'inactive').
 * Preserves historical records for payroll/attendance/leaves.
 * Allowed for ADMIN and HR only.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {string} options.id
 */
const deactivateEmployee = async ({ user, id }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can deactivate employees.');
    err.statusCode = 403;
    throw err;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { employeeId: id.toUpperCase() };

  const employee = await Employee.findOne(query);
  if (!employee) {
    const err = new Error(`Employee not found with identifier: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  employee.employmentStatus = 'inactive';
  await employee.save();

  return employee;
};

/**
 * Returns distinct departments across the employee collection.
 *
 * @returns {Promise<string[]>}
 */
const getDistinctDepartments = async () => {
  return Employee.distinct('department');
};

module.exports = {
  generateNextEmployeeId,
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getDistinctDepartments,
};
