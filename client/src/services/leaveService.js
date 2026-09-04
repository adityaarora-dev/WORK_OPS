import api from './api';

export const getLeaves = async (params = {}) => {
  const response = await api.get('/leaves', { params });
  return response.data;
};

export const getLeaveSummary = async () => {
  const response = await api.get('/leaves/summary');
  return response.data;
};

export const getLeaveById = async (id) => {
  const response = await api.get(`/leaves/${id}`);
  return response.data;
};

export const applyLeave = async (data) => {
  const response = await api.post('/leaves', data);
  return response.data;
};

export const reviewLeave = async (id, status, comment = '') => {
  const response = await api.patch(`/leaves/${id}`, { status, comment });
  return response.data;
};

export const cancelLeave = async (id) => {
  const response = await api.delete(`/leaves/${id}`);
  return response.data;
};

export default {
  getLeaves,
  getLeaveSummary,
  getLeaveById,
  applyLeave,
  reviewLeave,
  cancelLeave,
};
