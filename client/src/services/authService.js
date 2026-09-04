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
 * Dispatches a 6-digit OTP code to email & phone for registration.
 *
 * @param {Object} data - { email, phone, firstName, lastName, purpose }
 */
export const sendOtp = async (data) => {
  const response = await api.post('/auth/send-otp', data);
  return response.data;
};

/**
 * Verifies OTP and registers a new employee directly into the database.
 *
 * @param {Object} data - { email, otp, password, firstName, lastName, phone, designation, department }
 */
export const verifyOtpRegister = async (data) => {
  const response = await api.post('/auth/verify-otp-register', data);
  return response.data;
};

/**
 * Dispatches OTP code to registered employee email for passwordless login.
 *
 * @param {string} email
 */
export const sendLoginOtp = async (email) => {
  const response = await api.post('/auth/send-login-otp', { email });
  return response.data;
};

/**
 * Verifies login OTP and authenticates user.
 *
 * @param {string} email
 * @param {string} otp
 */
export const verifyLoginOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-login-otp', { email, otp });
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

/**
 * Requests a password reset link for the provided corporate email.
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Validates a password reset token.
 *
 * @param {string} token
 * @returns {Promise<{ success: boolean, message: string, email?: string }>}
 */
export const verifyResetToken = async (token) => {
  const response = await api.get(`/auth/reset-password/${token}`);
  return response.data;
};

/**
 * Submits a new password along with the reset token.
 *
 * @param {string} token
 * @param {string} password
 * @param {string} [confirmPassword]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resetPassword = async (token, password, confirmPassword) => {
  const response = await api.post(`/auth/reset-password/${token}`, {
    password,
    confirmPassword,
  });
  return response.data;
};
