const mongoose = require('mongoose');
const { Department } = require('../models/Department');
const { Employee } = require('../models/Employee');

/**
 * Generates the next sequential Department ID (e.g. DEPT001, DEPT002).
 * Server-side generation prevents collision and invalid identifiers.
 *
 * @returns {Promise<string>}
 */
const generateNextDepartmentId = async () => {
  const lastDept = await Department.findOne({ departmentId: /^DEPT\d+$/i })
    .sort({ departmentId: -1 })
    .select('departmentId')
    .lean();

  if (!lastDept || !lastDept.departmentId) {
    return 'DEPT001';
  }

  const match = lastDept.departmentId.match(/^DEPT(\d+)$/i);
  if (!match) {
    return 'DEPT001';
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `DEPT${String(nextNum).padStart(3, '0')}`;
};

/**
 * Resolves a department name string or ObjectId into a verified Department document _id.
 * If a department with the given name does not exist, it creates one cleanly.
 *
 * @param {string} nameOrId
 * @returns {Promise<mongoose.Types.ObjectId>}
 */
const resolveDepartmentId = async (nameOrId) => {
  if (!nameOrId) return null;

  if (mongoose.Types.ObjectId.isValid(nameOrId)) {
    const existing = await Department.findById(nameOrId).select('_id');
    if (existing) return existing._id;
  }

  const name = String(nameOrId).trim();
  let dept = await Department.findOne({
    $or: [{ name: new RegExp(`^${name}$`, 'i') }, { departmentId: name.toUpperCase() }],
  });

  if (!dept) {
    const nextDeptId = await generateNextDepartmentId();
    dept = await Department.create({
      departmentId: nextDeptId,
      name,
      description: `${name} Department`,
      status: 'active',
    });
  }

  return dept._id;
};

/**
 * Retrieves paginated, filtered departments with computed employee counts.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {Object} options.query
 */
const getDepartments = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status && query.status.trim() !== '') {
    filter.status = query.status.trim().toLowerCase();
  }

  if (query.search && query.search.trim() !== '') {
    const s = query.search.trim();
    const searchRegex = new RegExp(s, 'i');
    filter.$or = [
      { name: searchRegex },
      { departmentId: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
    ];
  }

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const [total, departments] = await Promise.all([
    Department.countDocuments(filter),
    Department.find(filter)
      .populate('departmentHead', 'firstName lastName email employeeId designation')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // Compute active employee count for each department
  const deptIds = departments.map((d) => d._id);
  const employeeCounts = await Employee.aggregate([
    { $match: { department: { $in: deptIds }, employmentStatus: 'active' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  employeeCounts.forEach((c) => {
    countMap[c._id.toString()] = c.count;
  });

  const enrichedDepartments = departments.map((d) => ({
    ...d,
    employeeCount: countMap[d._id.toString()] || 0,
  }));

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    departments: enrichedDepartments,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieves a single department along with its assigned employee list.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {string} options.id - ObjectId or departmentId
 */
const getDepartmentById = async ({ user, id }) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { departmentId: id.toUpperCase() };

  const department = await Department.findOne(query)
    .populate('departmentHead', 'firstName lastName email employeeId designation')
    .lean();

  if (!department) {
    const err = new Error(`Department not found with identifier: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  // Fetch employees belonging to this department
  const employees = await Employee.find({ department: department._id })
    .select('employeeId firstName lastName email designation employmentStatus employmentType joiningDate')
    .sort({ firstName: 1 })
    .lean();

  return {
    ...department,
    employees,
    employeeCount: employees.filter((e) => e.employmentStatus === 'active').length,
    totalEmployeeCount: employees.length,
  };
};

/**
 * Creates a new department record.
 * Allowed for ADMIN and HR only.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {Object} options.data
 */
const createDepartment = async ({ user, data }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can create departments.');
    err.statusCode = 403;
    throw err;
  }

  const name = (data.name || '').trim();
  if (!name) {
    const err = new Error('Department name is required.');
    err.statusCode = 400;
    throw err;
  }

  // Check unique department name
  const existingName = await Department.findOne({
    name: new RegExp(`^${name}$`, 'i'),
  });
  if (existingName) {
    const err = new Error(`A department named "${name}" already exists.`);
    err.statusCode = 409;
    throw err;
  }

  const departmentId = await generateNextDepartmentId();

  let departmentHead = null;
  if (data.departmentHead && mongoose.Types.ObjectId.isValid(data.departmentHead)) {
    const headEmp = await Employee.findById(data.departmentHead).select('_id');
    if (headEmp) {
      departmentHead = headEmp._id;
    }
  }

  const newDept = await Department.create({
    departmentId,
    name,
    description: (data.description || '').trim(),
    departmentHead,
    location: (data.location || 'Main Campus').trim(),
    status: data.status || 'active',
  });

  return newDept;
};

/**
 * Updates an existing department record.
 * Allowed for ADMIN and HR only.
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {string} options.id
 * @param {Object} options.data
 */
const updateDepartment = async ({ user, id, data }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can update departments.');
    err.statusCode = 403;
    throw err;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { departmentId: id.toUpperCase() };

  const department = await Department.findOne(query);
  if (!department) {
    const err = new Error(`Department not found with identifier: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  // Check unique department name collision if name changed
  if (data.name && data.name.trim().toLowerCase() !== department.name.toLowerCase()) {
    const newName = data.name.trim();
    const existing = await Department.findOne({
      name: new RegExp(`^${newName}$`, 'i'),
    });
    if (existing && !existing._id.equals(department._id)) {
      const err = new Error(`Department name "${newName}" is already taken.`);
      err.statusCode = 409;
      throw err;
    }
    department.name = newName;
  }

  if (data.description !== undefined) department.description = data.description.trim();
  if (data.location !== undefined) department.location = data.location.trim();
  if (data.status !== undefined) department.status = data.status;

  if (data.departmentHead !== undefined) {
    if (data.departmentHead && mongoose.Types.ObjectId.isValid(data.departmentHead)) {
      department.departmentHead = data.departmentHead;
    } else {
      department.departmentHead = null;
    }
  }

  await department.save();
  return department;
};

/**
 * Safely deactivates a department (status: 'inactive').
 * Enforces rule: Cannot deactivate while active employees are assigned to it!
 *
 * @param {Object} options
 * @param {Object} options.user
 * @param {string} options.id
 */
const deactivateDepartment = async ({ user, id }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can deactivate departments.');
    err.statusCode = 403;
    throw err;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { departmentId: id.toUpperCase() };

  const department = await Department.findOne(query);
  if (!department) {
    const err = new Error(`Department not found with identifier: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  // Check for assigned active employees
  const activeEmployeesCount = await Employee.countDocuments({
    department: department._id,
    employmentStatus: 'active',
  });

  if (activeEmployeesCount > 0) {
    const err = new Error(
      `Department cannot be deactivated while active employees (${activeEmployeesCount}) are assigned to it. Please reassign employees first.`
    );
    err.statusCode = 409;
    throw err;
  }

  department.status = 'inactive';
  await department.save();
  return department;
};

module.exports = {
  generateNextDepartmentId,
  resolveDepartmentId,
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
