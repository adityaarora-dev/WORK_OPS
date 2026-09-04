const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const recruitmentController = require('../controllers/recruitment.controller');

const router = express.Router();

// All recruitment routes require authenticated user and block standard employees
router.use(authenticateUser);
router.use(authorizeRoles('admin', 'hr', 'manager'));

// Summary endpoint
router.get('/summary', recruitmentController.getRecruitmentSummary);

// ---------------------------------------------------------------------------
// Job Openings
// ---------------------------------------------------------------------------
router.get('/jobs', recruitmentController.getJobs);
router.get('/jobs/:id', recruitmentController.getJobById);
router.post('/jobs', authorizeRoles('admin', 'hr'), recruitmentController.createJob);
router.patch('/jobs/:id', authorizeRoles('admin', 'hr'), recruitmentController.updateJob);
router.delete('/jobs/:id', authorizeRoles('admin', 'hr'), recruitmentController.deleteJob);

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------
router.get('/candidates', recruitmentController.getCandidates);
router.get('/candidates/:id', recruitmentController.getCandidateById);
router.post('/candidates', authorizeRoles('admin', 'hr'), recruitmentController.createCandidate);
router.patch('/candidates/:id', authorizeRoles('admin', 'hr'), recruitmentController.updateCandidate);

// ---------------------------------------------------------------------------
// Applications & Pipeline
// ---------------------------------------------------------------------------
router.get('/applications', recruitmentController.getApplications);
router.get('/applications/:id', recruitmentController.getApplicationById);
router.post('/applications', authorizeRoles('admin', 'hr'), recruitmentController.createApplication);
router.patch('/applications/:id', authorizeRoles('admin', 'hr'), recruitmentController.updateApplication);
router.post('/applications/:id/stage', authorizeRoles('admin', 'hr', 'manager'), recruitmentController.updateApplicationStage);
router.post(
  '/applications/:id/convert-to-employee',
  authorizeRoles('admin', 'hr'),
  recruitmentController.convertToEmployee
);

// ---------------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------------
router.get('/interviews', recruitmentController.getInterviews);
router.get('/interviews/:id', recruitmentController.getInterviewById);
router.post('/interviews', authorizeRoles('admin', 'hr'), recruitmentController.createInterview);
router.patch('/interviews/:id', recruitmentController.updateInterview);

module.exports = router;
