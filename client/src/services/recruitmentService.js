import api from './api';

// Summary
export const getRecruitmentSummary = async () => {
  const response = await api.get('/recruitment/summary');
  return response.data;
};

// Jobs
export const getJobs = async (params = {}) => {
  const response = await api.get('/recruitment/jobs', { params });
  return response.data;
};

export const getJobById = async (id) => {
  const response = await api.get(`/recruitment/jobs/${id}`);
  return response.data;
};

export const createJob = async (data) => {
  const response = await api.post('/recruitment/jobs', data);
  return response.data;
};

export const updateJob = async (id, data) => {
  const response = await api.patch(`/recruitment/jobs/${id}`, data);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await api.delete(`/recruitment/jobs/${id}`);
  return response.data;
};

// Candidates
export const getCandidates = async (params = {}) => {
  const response = await api.get('/recruitment/candidates', { params });
  return response.data;
};

export const getCandidateById = async (id) => {
  const response = await api.get(`/recruitment/candidates/${id}`);
  return response.data;
};

export const createCandidate = async (data) => {
  const response = await api.post('/recruitment/candidates', data);
  return response.data;
};

export const updateCandidate = async (id, data) => {
  const response = await api.patch(`/recruitment/candidates/${id}`, data);
  return response.data;
};

// Applications & Pipeline
export const getApplications = async (params = {}) => {
  const response = await api.get('/recruitment/applications', { params });
  return response.data;
};

export const getApplicationById = async (id) => {
  const response = await api.get(`/recruitment/applications/${id}`);
  return response.data;
};

export const createApplication = async (data) => {
  const response = await api.post('/recruitment/applications', data);
  return response.data;
};

export const updateApplication = async (id, data) => {
  const response = await api.patch(`/recruitment/applications/${id}`, data);
  return response.data;
};

export const updateApplicationStage = async (id, { stage, notes, rejectionReason }) => {
  const response = await api.post(`/recruitment/applications/${id}/stage`, {
    stage,
    notes,
    rejectionReason,
  });
  return response.data;
};

export const convertToEmployee = async (applicationId, employeeData) => {
  const response = await api.post(
    `/recruitment/applications/${applicationId}/convert-to-employee`,
    employeeData
  );
  return response.data;
};

// Interviews
export const getInterviews = async (params = {}) => {
  const response = await api.get('/recruitment/interviews', { params });
  return response.data;
};

export const getInterviewById = async (id) => {
  const response = await api.get(`/recruitment/interviews/${id}`);
  return response.data;
};

export const createInterview = async (data) => {
  const response = await api.post('/recruitment/interviews', data);
  return response.data;
};

export const updateInterview = async (id, data) => {
  const response = await api.patch(`/recruitment/interviews/${id}`, data);
  return response.data;
};

export default {
  getRecruitmentSummary,
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStage,
  convertToEmployee,
  getInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
};
