import api from './api';

/**
 * Authentication service communicating with /api/auth endpoints.
 */

/**
 * Authenticates a user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Fetches current authenticated user profile using active token.
 *
 * @returns {Promise<{ user: Object }>}
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Notifies the backend of user logout.
 */
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch {
    return { success: true };
  }
};

/**
 * Public employee registration.
 *
 * @param {Object} userData
 */
export const registerEmployee = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Executes a role-protected test endpoint to verify backend authorization.
 *
 * @param {'admin'|'hr'|'manager'|'employee'} targetRole
 */
export const testRoleEndpoint = async (targetRole) => {
  const response = await api.get(`/test/${targetRole}`);
  return response.data;
};
