import api from './api';

// Cycles
export const getPerformanceCycles = async (params = {}) => {
  const response = await api.get('/performance/cycles', { params });
  return response.data;
};

export const getPerformanceCycleById = async (id) => {
  const response = await api.get(`/performance/cycles/${id}`);
  return response.data;
};

export const createPerformanceCycle = async (data) => {
  const response = await api.post('/performance/cycles', data);
  return response.data;
};

export const updatePerformanceCycle = async (id, data) => {
  const response = await api.patch(`/performance/cycles/${id}`, data);
  return response.data;
};

// Goals
export const getGoals = async (params = {}) => {
  const response = await api.get('/performance/goals', { params });
  return response.data;
};

export const getGoalById = async (id) => {
  const response = await api.get(`/performance/goals/${id}`);
  return response.data;
};

export const createGoal = async (data) => {
  const response = await api.post('/performance/goals', data);
  return response.data;
};

export const updateGoal = async (id, data) => {
  const response = await api.patch(`/performance/goals/${id}`, data);
  return response.data;
};

// Reviews
export const getReviews = async (params = {}) => {
  const response = await api.get('/performance/reviews', { params });
  return response.data;
};

export const getReviewById = async (id) => {
  const response = await api.get(`/performance/reviews/${id}`);
  return response.data;
};

export const createReview = async (data) => {
  const response = await api.post('/performance/reviews', data);
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await api.patch(`/performance/reviews/${id}`, data);
  return response.data;
};

// Employee self-service
export const getMyPerformance = async () => {
  const response = await api.get('/performance/my');
  return response.data;
};

export default {
  getPerformanceCycles,
  getPerformanceCycleById,
  createPerformanceCycle,
  updatePerformanceCycle,
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  getMyPerformance,
};
