import api from './api';

export const getPayroll = async (params = {}) => {
  const response = await api.get('/payroll', { params });
  return response.data;
};

export const getPayrollSummary = async () => {
  const response = await api.get('/payroll/summary');
  return response.data;
};

export const getPayrollById = async (id) => {
  const response = await api.get(`/payroll/${id}`);
  return response.data;
};

export const createPayroll = async (data) => {
  const response = await api.post('/payroll', data);
  return response.data;
};

export const updatePayroll = async (id, data) => {
  const response = await api.patch(`/payroll/${id}`, data);
  return response.data;
};

export default {
  getPayroll,
  getPayrollSummary,
  getPayrollById,
  createPayroll,
  updatePayroll,
};
