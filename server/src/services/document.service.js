const mongoose = require('mongoose');
const { EmployeeDocument } = require('../models/EmployeeDocument');
const { Employee } = require('../models/Employee');
const storageService = require('./storage.service');

/**
 * Retrieves paginated document records with role authorization.
 */
const getDocumentsList = async ({ user, query = {} }) => {
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
      return { documents: [], pagination: { page, limit, total: 0, totalPages: 0 } };
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
      return { documents: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.employee = emp._id;
  }

  // Filters
  if (query.status && query.status.trim() !== '') {
    filter.status = query.status.trim().toLowerCase();
  } else {
    // Default to active documents unless specified
    filter.status = 'active';
  }

  if (query.documentType && query.documentType.trim() !== '') {
    filter.documentType = query.documentType.trim().toLowerCase();
  }

  if (query.employee && query.employee.trim() !== '') {
    const empVal = query.employee.trim();
    if (mongoose.Types.ObjectId.isValid(empVal)) {
      filter.employee = empVal;
    } else {
      const found = await Employee.findOne({ employeeId: empVal.toUpperCase() }).select('_id');
      if (found) filter.employee = found._id;
    }
  }

  const [total, documents] = await Promise.all([
    EmployeeDocument.countDocuments(filter),
    EmployeeDocument.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId firstName lastName email designation department',
        populate: { path: 'department', select: 'name departmentId' },
      })
      .populate('uploadedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    documents,
    pagination: { page, limit, total, totalPages },
  };
};

/**
 * Retrieves a single document with resource-level authorization.
 */
const getDocumentById = async ({ user, id }) => {
  const doc = await EmployeeDocument.findById(id)
    .populate({
      path: 'employee',
      select: 'employeeId firstName lastName email designation department manager user',
      populate: { path: 'department', select: 'name departmentId' },
    })
    .populate('uploadedBy', 'firstName lastName email role');

  if (!doc) {
    const err = new Error('Document record not found');
    err.statusCode = 404;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  if (userRole === 'admin' || userRole === 'hr') {
    return doc;
  }

  if (userRole === 'manager') {
    const mgr = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    const isSelf = mgr && doc.employee._id.equals(mgr._id);
    const isTeam = mgr && doc.employee.manager && doc.employee.manager.equals(mgr._id);
    if (!isSelf && !isTeam) {
      const err = new Error('Access Denied: You cannot view documents for employees outside your team.');
      err.statusCode = 403;
      throw err;
    }
    return doc;
  }

  if (userRole === 'employee') {
    const isSelfUser = doc.employee.user && doc.employee.user.equals(user._id);
    const isSelfEmpId = doc.employee.employeeId === user.employeeId;
    if (!isSelfUser && !isSelfEmpId) {
      const err = new Error('Access Denied: You can only view your own documents.');
      err.statusCode = 403;
      throw err;
    }
    return doc;
  }

  const err = new Error('Forbidden');
  err.statusCode = 403;
  throw err;
};

/**
 * Uploads and records a new employee document.
 */
const createDocument = async ({ user, file, data }) => {
  if (!file) {
    const err = new Error('No file provided for upload.');
    err.statusCode = 400;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  let employeeId = data.employee;

  if (userRole === 'employee') {
    const selfEmp = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: user.employeeId }, { email: user.email }],
    }).select('_id');
    if (!selfEmp) {
      storageService.deleteFile(file.path);
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
    storageService.deleteFile(file.path);
    const err = new Error('Employee reference is required');
    err.statusCode = 400;
    throw err;
  }

  const title = (data.title || file.originalname).trim();
  const documentType = data.documentType || 'other';

  const newDoc = await EmployeeDocument.create({
    employee: employeeId,
    documentType,
    title,
    description: (data.description || '').trim(),
    fileName: file.originalname,
    storedFileName: file.filename,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy: user._id,
    status: 'active',
  });

  return newDoc;
};

/**
 * Soft deactivates / archives a document (status: 'archived').
 */
const archiveDocument = async ({ user, id }) => {
  const doc = await EmployeeDocument.findById(id).populate('employee');
  if (!doc) {
    const err = new Error('Document record not found');
    err.statusCode = 404;
    throw err;
  }

  const userRole = (user.role || '').toLowerCase();
  const isOwner = doc.employee.user && doc.employee.user.equals(user._id);

  if (!isOwner && userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: You do not have permission to archive this document.');
    err.statusCode = 403;
    throw err;
  }

  doc.status = 'archived';
  await doc.save();
  return doc;
};

/**
 * Permanently removes a document and its storage file (Admin only).
 */
const deleteDocument = async ({ user, id }) => {
  const userRole = (user.role || '').toLowerCase();
  if (userRole !== 'admin' && userRole !== 'hr') {
    const err = new Error('Forbidden: Only Administrators and HR can permanently delete documents.');
    err.statusCode = 403;
    throw err;
  }

  const doc = await EmployeeDocument.findById(id);
  if (!doc) {
    const err = new Error('Document record not found');
    err.statusCode = 404;
    throw err;
  }

  storageService.deleteFile(doc.filePath);
  await EmployeeDocument.deleteOne({ _id: doc._id });

  return { success: true, message: 'Document permanently deleted' };
};

module.exports = {
  getDocumentsList,
  getDocumentById,
  createDocument,
  archiveDocument,
  deleteDocument,
};
