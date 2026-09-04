import api from './api';

/**
 * Service for interacting with /api/departments endpoints.
 */

export const getDepartments = async (params = {}) => {
  const response = await api.get('/departments', { params });
  return response.data;
};

export const getDepartmentById = async (id) => {
  const response = await api.get(`/departments/${id}`);
  return response.data;
};

export const createDepartment = async (departmentData) => {
  const response = await api.post('/departments', departmentData);
  return response.data;
};

export const updateDepartment = async (id, updateData) => {
  const response = await api.patch(`/departments/${id}`, updateData);
  return response.data;
};

export const deactivateDepartment = async (id) => {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
};

export default {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
