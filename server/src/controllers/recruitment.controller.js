const recruitmentService = require('../services/recruitment.service');

// ============================================================================
// RECRUITMENT SUMMARY
// ============================================================================

const getRecruitmentSummary = async (req, res, next) => {
  try {
    const summary = await recruitmentService.getRecruitmentSummary();
    return res.status(200).json({
      success: true,
      message: 'Recruitment summary retrieved successfully.',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// JOB OPENINGS
// ============================================================================

const getJobs = async (req, res, next) => {
  try {
    const result = await recruitmentService.getJobs({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Job openings retrieved successfully.',
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await recruitmentService.getJobById(req.params.id);
    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const job = await recruitmentService.createJob({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: `Job opening "${job.title}" (${job.jobId}) created successfully.`,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await recruitmentService.updateJob({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Job opening updated successfully.',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const result = await recruitmentService.deleteJob({
      id: req.params.id,
      user: req.user,
    });
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CANDIDATES
// ============================================================================

const getCandidates = async (req, res, next) => {
  try {
    const result = await recruitmentService.getCandidates({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Candidates retrieved successfully.',
      data: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getCandidateById = async (req, res, next) => {
  try {
    const candidate = await recruitmentService.getCandidateById(req.params.id);
    return res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

const createCandidate = async (req, res, next) => {
  try {
    const candidate = await recruitmentService.createCandidate({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: `Candidate "${candidate.fullName}" (${candidate.candidateId}) added successfully.`,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

const updateCandidate = async (req, res, next) => {
  try {
    const candidate = await recruitmentService.updateCandidate({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Candidate updated successfully.',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// APPLICATIONS
// ============================================================================

const getApplications = async (req, res, next) => {
  try {
    const result = await recruitmentService.getApplications({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully.',
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const application = await recruitmentService.getApplicationById(req.params.id);
    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const createApplication = async (req, res, next) => {
  try {
    const application = await recruitmentService.createApplication({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Job application created successfully.',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const updateApplication = async (req, res, next) => {
  try {
    const application = await recruitmentService.updateApplication({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Application updated successfully.',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStage = async (req, res, next) => {
  try {
    const { stage, notes, rejectionReason } = req.body;
    const application = await recruitmentService.updateApplicationStage({
      id: req.params.id,
      stage,
      notes,
      rejectionReason,
      user: req.user,
    });
    return res.status(200).json({
      success: true,
      message: `Application advanced to stage "${stage}".`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const convertToEmployee = async (req, res, next) => {
  try {
    const result = await recruitmentService.convertToEmployee({
      applicationId: req.params.id,
      user: req.user,
      employeeData: req.body,
    });
    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// INTERVIEWS
// ============================================================================

const getInterviews = async (req, res, next) => {
  try {
    const result = await recruitmentService.getInterviews({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Interviews retrieved successfully.',
      data: result.interviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getInterviewById = async (req, res, next) => {
  try {
    const interview = await recruitmentService.getInterviewById(req.params.id);
    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const createInterview = async (req, res, next) => {
  try {
    const interview = await recruitmentService.createInterview({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully.',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

const updateInterview = async (req, res, next) => {
  try {
    const interview = await recruitmentService.updateInterview({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Interview updated successfully.',
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecruitmentSummary,
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
};
