import api from './api';

/**
 * Service to interact with /api/employees endpoints.
 */

/**
 * Retrieves paginated, filtered, and role-scoped employees.
 *
 * @param {Object} params - { page, limit, search, department, employmentStatus, employmentType }
 */
export const getEmployees = async (params = {}) => {
  const response = await api.get('/employees', { params });
  return response.data;
};

/**
 * Retrieves an individual employee profile with resource-level authorization.
 *
 * @param {string} id - Mongo ObjectId or employeeId
 */
export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

/**
 * Creates a new employee record.
 * Allowed for ADMIN and HR only.
 *
 * @param {Object} employeeData
 */
export const createEmployee = async (employeeData) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

/**
 * Updates an employee's record.
 * Allowed for ADMIN and HR only.
 *
 * @param {string} id
 * @param {Object} updateData
 */
export const updateEmployee = async (id, updateData) => {
  const response = await api.patch(`/employees/${id}`, updateData);
  return response.data;
};

/**
 * Soft-deactivates an employee (sets status: 'inactive').
 * Allowed for ADMIN and HR only.
 *
 * @param {string} id
 */
export const deactivateEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

/**
 * Fetches distinct list of departments for dropdown filters.
 */
export const getDistinctDepartments = async () => {
  const response = await api.get('/employees/meta/departments');
  return response.data;
};

export default {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  getDistinctDepartments,
};
