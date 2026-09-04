import api from './api';

export const getAttendance = async (params = {}) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const getAttendanceSummary = async () => {
  const response = await api.get('/attendance/summary');
  return response.data;
};

export const getAttendanceById = async (id) => {
  const response = await api.get(`/attendance/${id}`);
  return response.data;
};

export const recordAttendance = async (data) => {
  const response = await api.post('/attendance', data);
  return response.data;
};

export const updateAttendance = async (id, data) => {
  const response = await api.patch(`/attendance/${id}`, data);
  return response.data;
};

export default {
  getAttendance,
  getAttendanceSummary,
  getAttendanceById,
  recordAttendance,
  updateAttendance,
};
