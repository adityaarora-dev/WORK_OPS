import axios from 'axios';

/**
 * Base API URL read from Vite environment variable.
 * Fallback to default development endpoint if not configured.
 */
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Centralized Axios instance for the HR Management System.
 */
const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for future token injection (Stage 2+)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized API error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Format error message cleanly for consuming components
    const customError = {
      status: error.response?.status || 0,
      message: error.response?.data?.message || error.message || 'Unknown network error',
      data: error.response?.data || null,
      isNetworkError: !error.response,
    };
    return Promise.reject(customError);
  }
);

export default api;
