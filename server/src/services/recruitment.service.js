const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { JobOpening, JOB_STATUSES, EMPLOYMENT_TYPES } = require('../models/JobOpening');
const { Candidate, CANDIDATE_SOURCES, CANDIDATE_STATUSES } = require('../models/Candidate');
const { JobApplication, APPLICATION_STAGES, APPLICATION_STATUSES } = require('../models/JobApplication');
const { Interview, INTERVIEW_MODES, INTERVIEW_STATUSES } = require('../models/Interview');
const { Employee } = require('../models/Employee');
const { User } = require('../models/User');
const { Department } = require('../models/Department');
const { logAuditEvent } = require('./audit.service');
const { createNotification } = require('./notification.service');

// ============================================================================
// SEQUENTIAL IDENTIFIER GENERATORS
// ============================================================================

const generateNextJobId = async () => {
  const lastJob = await JobOpening.findOne({ jobId: /^JOB\d+$/i })
    .sort({ jobId: -1 })
    .select('jobId')
    .lean();

  if (!lastJob || !lastJob.jobId) return 'JOB001';
  const match = lastJob.jobId.match(/^JOB(\d+)$/i);
  if (!match) return 'JOB001';
  return `JOB${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
};

const generateNextCandidateId = async () => {
  const lastCandidate = await Candidate.findOne({ candidateId: /^CAN\d+$/i })
    .sort({ candidateId: -1 })
    .select('candidateId')
    .lean();

  if (!lastCandidate || !lastCandidate.candidateId) return 'CAN001';
  const match = lastCandidate.candidateId.match(/^CAN(\d+)$/i);
  if (!match) return 'CAN001';
  return `CAN${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
};

const generateNextApplicationId = async () => {
  const lastApp = await JobApplication.findOne({ applicationId: /^APP\d+$/i })
    .sort({ applicationId: -1 })
    .select('applicationId')
    .lean();

  if (!lastApp || !lastApp.applicationId) return 'APP001';
  const match = lastApp.applicationId.match(/^APP(\d+)$/i);
  if (!match) return 'APP001';
  return `APP${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
};

const generateNextInterviewId = async () => {
  const lastInterview = await Interview.findOne({ interviewId: /^INT\d+$/i })
    .sort({ interviewId: -1 })
    .select('interviewId')
    .lean();

  if (!lastInterview || !lastInterview.interviewId) return 'INT001';
  const match = lastInterview.interviewId.match(/^INT(\d+)$/i);
  if (!match) return 'INT001';
  return `INT${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
};

const generateNextEmployeeId = async () => {
  const lastEmployee = await Employee.findOne({ employeeId: /^EMP\d+$/i })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();

  if (!lastEmployee || !lastEmployee.employeeId) return 'EMP001';
  const match = lastEmployee.employeeId.match(/^EMP(\d+)$/i);
  if (!match) return 'EMP001';
  return `EMP${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
};

// ============================================================================
// 1. JOB OPENINGS
// ============================================================================

const getJobs = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user?.role || '').toLowerCase();

  // Search filter
  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { title: { $regex: s, $options: 'i' } },
      { designation: { $regex: s, $options: 'i' } },
      { jobId: { $regex: s, $options: 'i' } },
      { location: { $regex: s, $options: 'i' } },
    ];
  }

  if (query.status && JOB_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.department && mongoose.Types.ObjectId.isValid(query.department)) {
    filter.department = query.department;
  }

  if (query.employmentType && EMPLOYMENT_TYPES.includes(query.employmentType)) {
    filter.employmentType = query.employmentType;
  }

  const [total, jobs] = await Promise.all([
    JobOpening.countDocuments(filter),
    JobOpening.find(filter)
      .populate('department', 'name code location')
      .populate('createdBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // Aggregate application counts for each job
  const jobIds = jobs.map((j) => j._id);
  const applicationCounts = await JobApplication.aggregate([
    { $match: { jobOpening: { $in: jobIds } } },
    { $group: { _id: '$jobOpening', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  applicationCounts.forEach((c) => {
    countMap[c._id.toString()] = c.count;
  });

  const jobsWithCount = jobs.map((j) => ({
    ...j,
    applicantCount: countMap[j._id.toString()] || 0,
  }));

  return {
    jobs: jobsWithCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getJobById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { jobId: id.toUpperCase() };

  const job = await JobOpening.findOne(query)
    .populate('department', 'name code location departmentHead')
    .populate('createdBy', 'firstName lastName email role')
    .lean();

  if (!job) {
    const error = new Error('Job opening not found.');
    error.status = 404;
    throw error;
  }

  const applicantCount = await JobApplication.countDocuments({ jobOpening: job._id });
  return { ...job, applicantCount };
};

const createJob = async ({ user, data }) => {
  const {
    title,
    description,
    department,
    designation,
    employmentType,
    location,
    openings,
    requirements,
    responsibilities,
    salaryRange,
    status,
    closingDate,
  } = data;

  if (!title || !title.trim()) {
    const error = new Error('Job title is required.');
    error.status = 400;
    throw error;
  }

  if (!description || !description.trim()) {
    const error = new Error('Job description is required.');
    error.status = 400;
    throw error;
  }

  if (!designation || !designation.trim()) {
    const error = new Error('Designation is required.');
    error.status = 400;
    throw error;
  }

  if (!location || !location.trim()) {
    const error = new Error('Job location is required.');
    error.status = 400;
    throw error;
  }

  if (!department || !mongoose.Types.ObjectId.isValid(department)) {
    const error = new Error('Valid department ID is required.');
    error.status = 400;
    throw error;
  }

  const dept = await Department.findById(department);
  if (!dept) {
    const error = new Error('Department does not exist.');
    error.status = 404;
    throw error;
  }

  const jobId = await generateNextJobId();

  // Normalize requirements & responsibilities
  const reqArr = Array.isArray(requirements)
    ? requirements
    : typeof requirements === 'string' && requirements.trim()
    ? requirements.split('\n').map((r) => r.trim()).filter(Boolean)
    : [];

  const respArr = Array.isArray(responsibilities)
    ? responsibilities
    : typeof responsibilities === 'string' && responsibilities.trim()
    ? responsibilities.split('\n').map((r) => r.trim()).filter(Boolean)
    : [];

  const job = await JobOpening.create({
    jobId,
    title: title.trim(),
    description: description.trim(),
    department: dept._id,
    designation: designation.trim(),
    employmentType: employmentType && EMPLOYMENT_TYPES.includes(employmentType) ? employmentType : 'full-time',
    location: location.trim(),
    openings: openings ? Math.max(1, parseInt(openings, 10)) : 1,
    requirements: reqArr,
    responsibilities: respArr,
    salaryRange: {
      min: Number(salaryRange?.min) || 0,
      max: Number(salaryRange?.max) || 0,
      currency: salaryRange?.currency || 'INR',
    },
    status: status && JOB_STATUSES.includes(status) ? status : 'open',
    postedDate: status === 'open' ? new Date() : null,
    closingDate: closingDate ? new Date(closingDate) : null,
    createdBy: user._id,
  });

  return job;
};

const updateJob = async ({ id, user, data }) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { jobId: id.toUpperCase() };
  const job = await JobOpening.findOne(query);

  if (!job) {
    const error = new Error('Job opening not found.');
    error.status = 404;
    throw error;
  }

  if (data.title) job.title = data.title.trim();
  if (data.description) job.description = data.description.trim();
  if (data.designation) job.designation = data.designation.trim();
  if (data.location) job.location = data.location.trim();
  if (data.openings !== undefined) job.openings = Math.max(1, parseInt(data.openings, 10) || 1);
  if (data.employmentType && EMPLOYMENT_TYPES.includes(data.employmentType)) job.employmentType = data.employmentType;

  if (data.department && mongoose.Types.ObjectId.isValid(data.department)) {
    const dept = await Department.findById(data.department);
    if (!dept) {
      const error = new Error('Department not found.');
      error.status = 404;
      throw error;
    }
    job.department = dept._id;
  }

  if (data.requirements !== undefined) {
    job.requirements = Array.isArray(data.requirements)
      ? data.requirements
      : typeof data.requirements === 'string'
      ? data.requirements.split('\n').map((r) => r.trim()).filter(Boolean)
      : [];
  }

  if (data.responsibilities !== undefined) {
    job.responsibilities = Array.isArray(data.responsibilities)
      ? data.responsibilities
      : typeof data.responsibilities === 'string'
      ? data.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean)
      : [];
  }

  if (data.salaryRange) {
    job.salaryRange = {
      min: Number(data.salaryRange.min) || 0,
      max: Number(data.salaryRange.max) || 0,
      currency: data.salaryRange.currency || 'INR',
    };
  }

  if (data.status && JOB_STATUSES.includes(data.status)) {
    if (data.status === 'open' && !job.postedDate) {
      job.postedDate = new Date();
    }
    job.status = data.status;
  }

  if (data.closingDate !== undefined) {
    job.closingDate = data.closingDate ? new Date(data.closingDate) : null;
  }

  await job.save();
  return job;
};

const deleteJob = async ({ id, user }) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { jobId: id.toUpperCase() };
  const job = await JobOpening.findOne(query);

  if (!job) {
    const error = new Error('Job opening not found.');
    error.status = 404;
    throw error;
  }

  const appCount = await JobApplication.countDocuments({ jobOpening: job._id });
  if (appCount > 0) {
    // Preserve history: soft-close instead of deleting
    job.status = 'closed';
    await job.save();
    return { deleted: false, closed: true, message: `Job has ${appCount} applicant(s). Status set to closed.` };
  }

  await JobOpening.findByIdAndDelete(job._id);
  return { deleted: true, message: 'Job opening deleted successfully.' };
};

// ============================================================================
// 2. CANDIDATES
// ============================================================================

const getCandidates = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { candidateId: { $regex: s, $options: 'i' } },
      { skills: { $in: [new RegExp(s, 'i')] } },
    ];
  }

  if (query.status && CANDIDATE_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.source && CANDIDATE_SOURCES.includes(query.source)) {
    filter.source = query.source;
  }

  const [total, candidates] = await Promise.all([
    Candidate.countDocuments(filter),
    Candidate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    candidates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getCandidateById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { candidateId: id.toUpperCase() };

  const candidate = await Candidate.findOne(query).lean();
  if (!candidate) {
    const error = new Error('Candidate not found.');
    error.status = 404;
    throw error;
  }

  // Load application history for candidate
  const applications = await JobApplication.find({ candidate: candidate._id })
    .populate('jobOpening', 'jobId title designation department status')
    .sort({ createdAt: -1 })
    .lean();

  return { ...candidate, applications };
};

const createCandidate = async ({ user, data }) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    resumeUrl,
    skills,
    experience,
    education,
    source,
    notes,
    status,
  } = data;

  if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
    const error = new Error('First name and last name are required.');
    error.status = 400;
    throw error;
  }

  if (!email || !email.trim()) {
    const error = new Error('Candidate email is required.');
    error.status = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingCandidate = await Candidate.findOne({ email: normalizedEmail });
  if (existingCandidate) {
    const error = new Error(`Candidate with email "${normalizedEmail}" already exists (${existingCandidate.candidateId}).`);
    error.status = 409;
    throw error;
  }

  const candidateId = await generateNextCandidateId();

  const skillsArr = Array.isArray(skills)
    ? skills.map((s) => s.trim()).filter(Boolean)
    : typeof skills === 'string' && skills.trim()
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const candidate = await Candidate.create({
    candidateId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone: (phone || '').trim(),
    address: address || {},
    resumeUrl: (resumeUrl || '').trim(),
    skills: skillsArr,
    experience: Number(experience) || 0,
    education: (education || '').trim(),
    source: source && CANDIDATE_SOURCES.includes(source) ? source : 'Direct',
    notes: (notes || '').trim(),
    status: status && CANDIDATE_STATUSES.includes(status) ? status : 'new',
  });

  return candidate;
};

const updateCandidate = async ({ id, user, data }) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { candidateId: id.toUpperCase() };
  const candidate = await Candidate.findOne(query);

  if (!candidate) {
    const error = new Error('Candidate not found.');
    error.status = 404;
    throw error;
  }

  if (data.firstName) candidate.firstName = data.firstName.trim();
  if (data.lastName) candidate.lastName = data.lastName.trim();

  if (data.email && data.email.trim().toLowerCase() !== candidate.email) {
    const norm = data.email.trim().toLowerCase();
    const duplicate = await Candidate.findOne({ _id: { $ne: candidate._id }, email: norm });
    if (duplicate) {
      const error = new Error(`Candidate with email "${norm}" already exists.`);
      error.status = 409;
      throw error;
    }
    candidate.email = norm;
  }

  if (data.phone !== undefined) candidate.phone = (data.phone || '').trim();
  if (data.address) candidate.address = { ...candidate.address, ...data.address };
  if (data.resumeUrl !== undefined) candidate.resumeUrl = (data.resumeUrl || '').trim();

  if (data.skills !== undefined) {
    candidate.skills = Array.isArray(data.skills)
      ? data.skills.map((s) => s.trim()).filter(Boolean)
      : typeof data.skills === 'string'
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  }

  if (data.experience !== undefined) candidate.experience = Math.max(0, Number(data.experience) || 0);
  if (data.education !== undefined) candidate.education = (data.education || '').trim();
  if (data.source && CANDIDATE_SOURCES.includes(data.source)) candidate.source = data.source;
  if (data.notes !== undefined) candidate.notes = (data.notes || '').trim();
  if (data.status && CANDIDATE_STATUSES.includes(data.status)) candidate.status = data.status;

  await candidate.save();
  return candidate;
};

// ============================================================================
// 3. JOB APPLICATIONS & PIPELINE
// ============================================================================

const getApplications = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.jobOpening && mongoose.Types.ObjectId.isValid(query.jobOpening)) {
    filter.jobOpening = query.jobOpening;
  }

  if (query.candidate && mongoose.Types.ObjectId.isValid(query.candidate)) {
    filter.candidate = query.candidate;
  }

  if (query.currentStage && APPLICATION_STAGES.includes(query.currentStage)) {
    filter.currentStage = query.currentStage;
  }

  if (query.status && APPLICATION_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  const [total, applications] = await Promise.all([
    JobApplication.countDocuments(filter),
    JobApplication.find(filter)
      .populate('candidate', 'candidateId firstName lastName email phone skills experience resumeUrl')
      .populate({
        path: 'jobOpening',
        select: 'jobId title designation department location employmentType status',
        populate: { path: 'department', select: 'name code' },
      })
      .populate('assignedRecruiter', 'firstName lastName email role')
      .populate('convertedToEmployee', 'employeeId firstName lastName designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getApplicationById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { applicationId: id.toUpperCase() };

  const application = await JobApplication.findOne(query)
    .populate('candidate')
    .populate({
      path: 'jobOpening',
      populate: { path: 'department', select: 'name code location' },
    })
    .populate('assignedRecruiter', 'firstName lastName email role')
    .populate({
      path: 'convertedToEmployee',
      select: 'employeeId firstName lastName designation department',
      populate: { path: 'department', select: 'name code' },
    })
    .lean();

  if (!application) {
    const error = new Error('Application not found.');
    error.status = 404;
    throw error;
  }

  // Fetch interviews scheduled for this application
  const interviews = await Interview.find({ application: application._id })
    .populate('interviewer', 'firstName lastName email role')
    .sort({ scheduledAt: -1 })
    .lean();

  return { ...application, interviews };
};

const createApplication = async ({ user, data }) => {
  const { candidate, jobOpening, assignedRecruiter, notes, currentStage } = data;

  if (!candidate || !mongoose.Types.ObjectId.isValid(candidate)) {
    const error = new Error('Valid Candidate ID is required.');
    error.status = 400;
    throw error;
  }

  if (!jobOpening || !mongoose.Types.ObjectId.isValid(jobOpening)) {
    const error = new Error('Valid Job Opening ID is required.');
    error.status = 400;
    throw error;
  }

  const [candDoc, jobDoc] = await Promise.all([
    Candidate.findById(candidate),
    JobOpening.findById(jobOpening),
  ]);

  if (!candDoc) {
    const error = new Error('Candidate not found.');
    error.status = 404;
    throw error;
  }

  if (!jobDoc) {
    const error = new Error('Job opening not found.');
    error.status = 404;
    throw error;
  }

  // Prevent duplicate application
  const existingApp = await JobApplication.findOne({
    candidate: candDoc._id,
    jobOpening: jobDoc._id,
  });

  if (existingApp) {
    const error = new Error(`Candidate "${candDoc.fullName}" has already applied for "${jobDoc.title}".`);
    error.status = 409;
    throw error;
  }

  const applicationId = await generateNextApplicationId();

  const app = await JobApplication.create({
    applicationId,
    candidate: candDoc._id,
    jobOpening: jobDoc._id,
    applicationDate: new Date(),
    currentStage: currentStage && APPLICATION_STAGES.includes(currentStage) ? currentStage : 'Applied',
    status: 'active',
    assignedRecruiter: assignedRecruiter && mongoose.Types.ObjectId.isValid(assignedRecruiter) ? assignedRecruiter : user._id,
    notes: (notes || '').trim(),
  });

  // Update candidate status to in_review if currently new
  if (candDoc.status === 'new') {
    candDoc.status = 'in_review';
    await candDoc.save();
  }

  return app;
};

const updateApplication = async ({ id, user, data }) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { applicationId: id.toUpperCase() };
  const app = await JobApplication.findOne(query);

  if (!app) {
    const error = new Error('Application not found.');
    error.status = 404;
    throw error;
  }

  if (data.assignedRecruiter && mongoose.Types.ObjectId.isValid(data.assignedRecruiter)) {
    app.assignedRecruiter = data.assignedRecruiter;
  }

  if (data.notes !== undefined) app.notes = (data.notes || '').trim();

  if (data.currentStage && APPLICATION_STAGES.includes(data.currentStage)) {
    app.currentStage = data.currentStage;
    if (data.currentStage === 'Rejected') {
      app.status = 'rejected';
      if (data.rejectionReason) app.rejectionReason = data.rejectionReason.trim();
    } else if (data.currentStage === 'Hired') {
      app.status = 'hired';
    }
  }

  if (data.status && APPLICATION_STATUSES.includes(data.status)) {
    app.status = data.status;
  }

  await app.save();
  return app;
};

const updateApplicationStage = async ({ id, stage, notes, rejectionReason, user }) => {
  if (!APPLICATION_STAGES.includes(stage)) {
    const error = new Error(`Invalid recruitment stage. Allowed: ${APPLICATION_STAGES.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { applicationId: id.toUpperCase() };
  const app = await JobApplication.findOne(query);

  if (!app) {
    const error = new Error('Application not found.');
    error.status = 404;
    throw error;
  }

  if (app.convertedToEmployee && stage !== 'Hired') {
    const error = new Error('Candidate has already been converted to an active employee; stage cannot be changed.');
    error.status = 400;
    throw error;
  }

  app.currentStage = stage;

  if (notes) {
    app.notes = (app.notes ? `${app.notes}\n` : '') + `[Stage changed to ${stage} by ${user.firstName} ${user.lastName}]: ${notes.trim()}`;
  }

  if (stage === 'Rejected') {
    app.status = 'rejected';
    app.rejectionReason = (rejectionReason || 'Not selected after review.').trim();
    // Update candidate status
    await Candidate.findByIdAndUpdate(app.candidate, { status: 'rejected' });
  } else if (stage === 'Hired') {
    app.status = 'hired';
    await Candidate.findByIdAndUpdate(app.candidate, { status: 'hired' });
  } else if (stage === 'Interview') {
    await Candidate.findByIdAndUpdate(app.candidate, { status: 'interviewing' });
  } else if (stage === 'Offer') {
    await Candidate.findByIdAndUpdate(app.candidate, { status: 'offered' });
  }

  await app.save();
  return app;
};

// ============================================================================
// 4. CANDIDATE -> EMPLOYEE CONVERSION (CRITICAL STAGE 10 REQUIREMENT)
// ============================================================================

const convertToEmployee = async ({ applicationId, user, employeeData = {} }) => {
  const userRole = (user?.role || '').toLowerCase();
  if (!['admin', 'hr'].includes(userRole)) {
    const error = new Error('Forbidden: Only HR or Admin can convert candidates into employees.');
    error.status = 403;
    throw error;
  }

  const query = mongoose.Types.ObjectId.isValid(applicationId)
    ? { _id: applicationId }
    : { applicationId: applicationId.toUpperCase() };

  const application = await JobApplication.findOne(query)
    .populate('candidate')
    .populate('jobOpening');

  if (!application) {
    const error = new Error('Job application not found.');
    error.status = 404;
    throw error;
  }

  if (application.convertedToEmployee) {
    const error = new Error('This candidate has already been converted into an employee.');
    error.status = 400;
    throw error;
  }

  const { candidate, jobOpening } = application;
  if (!candidate) {
    const error = new Error('Candidate details missing on application.');
    error.status = 400;
    throw error;
  }

  // Prevent email collision in Employee collection
  const existingEmployee = await Employee.findOne({ email: candidate.email.toLowerCase() });
  if (existingEmployee) {
    const error = new Error(`An active employee with email "${candidate.email}" already exists (${existingEmployee.employeeId}).`);
    error.status = 409;
    throw error;
  }

  // Determine required Employee fields
  const departmentId = employeeData.department || jobOpening?.department;
  if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
    const error = new Error('Valid department reference is required for employee onboarding.');
    error.status = 400;
    throw error;
  }

  const dept = await Department.findById(departmentId);
  if (!dept) {
    const error = new Error('Assigned department does not exist.');
    error.status = 404;
    throw error;
  }

  const designation = employeeData.designation || jobOpening?.designation || 'Staff';
  const employmentType = employeeData.employmentType || jobOpening?.employmentType || 'full-time';
  const joiningDate = employeeData.joiningDate ? new Date(employeeData.joiningDate) : new Date();

  let managerId = null;
  if (employeeData.manager) {
    if (mongoose.Types.ObjectId.isValid(employeeData.manager)) {
      const mgr = await Employee.findById(employeeData.manager);
      if (mgr) managerId = mgr._id;
    }
  }

  // Generate employee ID (or use provided custom ID)
  const employeeId = employeeData.employeeId && employeeData.employeeId.trim()
    ? employeeData.employeeId.trim().toUpperCase()
    : await generateNextEmployeeId();

  // Create User credential if one doesn't exist
  let userAccount = await User.findOne({ email: candidate.email.toLowerCase() });
  if (!userAccount) {
    const corporatePassword = `Corp@${employeeId}#`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(corporatePassword, salt);

    userAccount = await User.create({
      employeeId,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email.toLowerCase(),
      password: hashedPassword,
      role: 'employee',
      isActive: true,
    });
  }

  // Create Employee
  const employee = await Employee.create({
    employeeId,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email.toLowerCase(),
    phone: candidate.phone || '',
    address: candidate.address || {},
    department: dept._id,
    designation: designation.trim(),
    employmentType,
    joiningDate,
    employmentStatus: 'active',
    manager: managerId,
    user: userAccount._id,
  });

  // Update application with conversion linkage
  application.convertedToEmployee = employee._id;
  application.conversionDate = new Date();
  application.currentStage = 'Hired';
  application.status = 'hired';
  await application.save();

  // Update candidate status
  candidate.status = 'hired';
  await candidate.save();

  // Audit log (non-blocking)
  logAuditEvent({
    actor: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'CANDIDATE_CONVERT',
    entityType: 'Employee',
    entityId: employee._id,
    description: `Candidate ${candidate.fullName} converted to corporate employee (${employee.employeeId})`,
    metadata: { candidateId: candidate.candidateId, employeeId: employee.employeeId, designation: employee.designation },
  });

  return {
    employee,
    application,
    candidate,
    message: `Candidate ${candidate.fullName} successfully converted to Employee (${employee.employeeId}).`,
  };
};

// ============================================================================
// 5. INTERVIEWS
// ============================================================================

const getInterviews = async ({ user, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  const userRole = (user?.role || '').toLowerCase();

  // Role scoping: Manager only sees interviews they are conducting or in their department
  if (userRole === 'manager') {
    filter.interviewer = user._id;
  }

  if (query.status && INTERVIEW_STATUSES.includes(query.status)) {
    filter.status = query.status;
  }

  if (query.application && mongoose.Types.ObjectId.isValid(query.application)) {
    filter.application = query.application;
  }

  const [total, interviews] = await Promise.all([
    Interview.countDocuments(filter),
    Interview.find(filter)
      .populate({
        path: 'application',
        populate: [
          { path: 'candidate', select: 'candidateId firstName lastName email phone skills' },
          { path: 'jobOpening', select: 'jobId title designation department' },
        ],
      })
      .populate('interviewer', 'firstName lastName email role')
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    interviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getInterviewById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { interviewId: id.toUpperCase() };

  const interview = await Interview.findOne(query)
    .populate({
      path: 'application',
      populate: [
        { path: 'candidate', select: 'candidateId firstName lastName email phone skills resumeUrl' },
        { path: 'jobOpening', select: 'jobId title designation department' },
      ],
    })
    .populate('interviewer', 'firstName lastName email role')
    .lean();

  if (!interview) {
    const error = new Error('Interview not found.');
    error.status = 404;
    throw error;
  }

  return interview;
};

const createInterview = async ({ user, data }) => {
  const { application, interviewer, scheduledAt, duration, mode, location, feedback, rating } = data;

  if (!application || !mongoose.Types.ObjectId.isValid(application)) {
    const error = new Error('Valid Application reference is required.');
    error.status = 400;
    throw error;
  }

  const appDoc = await JobApplication.findById(application);
  if (!appDoc) {
    const error = new Error('Application does not exist.');
    error.status = 404;
    throw error;
  }

  if (!scheduledAt) {
    const error = new Error('Scheduled date and time is required.');
    error.status = 400;
    throw error;
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    const error = new Error('Invalid interview schedule date.');
    error.status = 400;
    throw error;
  }

  // Interviewer user
  let interviewerId = interviewer;
  if (!interviewerId || !mongoose.Types.ObjectId.isValid(interviewerId)) {
    interviewerId = user._id;
  }

  const interviewerUser = await User.findById(interviewerId);
  if (!interviewerUser) {
    const error = new Error('Interviewer user not found.');
    error.status = 404;
    throw error;
  }

  const interviewId = await generateNextInterviewId();

  const interview = await Interview.create({
    interviewId,
    application: appDoc._id,
    interviewer: interviewerUser._id,
    scheduledAt: scheduledDate,
    duration: duration ? Math.min(240, Math.max(15, parseInt(duration, 10))) : 45,
    mode: mode && INTERVIEW_MODES.includes(mode) ? mode : 'video',
    location: (location || 'Google Meet').trim(),
    feedback: (feedback || '').trim(),
    rating: rating ? Math.min(5, Math.max(1, Number(rating))) : null,
    status: 'scheduled',
  });

  // Advance application stage to 'Interview' if prior stage
  if (['Applied', 'Screening', 'Shortlisted'].includes(appDoc.currentStage)) {
    appDoc.currentStage = 'Interview';
    await appDoc.save();
    await Candidate.findByIdAndUpdate(appDoc.candidate, { status: 'interviewing' });
  }

  return interview;
};

const updateInterview = async ({ id, user, data }) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { interviewId: id.toUpperCase() };
  const interview = await Interview.findOne(query);

  if (!interview) {
    const error = new Error('Interview not found.');
    error.status = 404;
    throw error;
  }

  const userRole = (user?.role || '').toLowerCase();
  const isInterviewer = interview.interviewer.toString() === user._id.toString();

  if (userRole === 'manager' && !isInterviewer) {
    const error = new Error('Forbidden: You can only update interviews assigned to you.');
    error.status = 403;
    throw error;
  }

  if (data.feedback !== undefined) interview.feedback = (data.feedback || '').trim();

  if (data.rating !== undefined) {
    if (data.rating === null || data.rating === '') {
      interview.rating = null;
    } else {
      const num = Number(data.rating);
      if (isNaN(num) || num < 1 || num > 5) {
        const error = new Error('Rating must be a number between 1 and 5.');
        error.status = 400;
        throw error;
      }
      interview.rating = num;
    }
  }

  if (data.status && INTERVIEW_STATUSES.includes(data.status)) {
    interview.status = data.status;
  }

  if (data.scheduledAt && ['admin', 'hr'].includes(userRole)) {
    const sDate = new Date(data.scheduledAt);
    if (!isNaN(sDate.getTime())) interview.scheduledAt = sDate;
  }

  if (data.location && ['admin', 'hr'].includes(userRole)) {
    interview.location = data.location.trim();
  }

  if (data.mode && INTERVIEW_MODES.includes(data.mode) && ['admin', 'hr'].includes(userRole)) {
    interview.mode = data.mode;
  }

  await interview.save();
  return interview;
};

// ============================================================================
// 6. RECRUITMENT DASHBOARD SUMMARY
// ============================================================================

const getRecruitmentSummary = async () => {
  const [openJobs, totalCandidates, activeApplications, scheduledInterviews] = await Promise.all([
    JobOpening.countDocuments({ status: 'open' }),
    Candidate.countDocuments({}),
    JobApplication.countDocuments({ status: 'active' }),
    Interview.countDocuments({ status: 'scheduled' }),
  ]);

  const stageCounts = await JobApplication.aggregate([
    { $group: { _id: '$currentStage', count: { $sum: 1 } } },
  ]);

  const stagesMap = {};
  APPLICATION_STAGES.forEach((stage) => {
    stagesMap[stage] = 0;
  });
  stageCounts.forEach((s) => {
    if (stagesMap[s._id] !== undefined) {
      stagesMap[s._id] = s.count;
    }
  });

  return {
    openJobs,
    totalCandidates,
    activeApplications,
    scheduledInterviews,
    stagesMap,
  };
};

module.exports = {
  // Jobs
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  // Candidates
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  // Applications
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStage,
  convertToEmployee,
  // Interviews
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  // Summary
  getRecruitmentSummary,
};
