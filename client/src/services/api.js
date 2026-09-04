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

// Request interceptor: attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track recent redirect & notification to prevent loops & spam
let isRedirecting = false;
let lastAuthNoticeTime = 0;

// Response interceptor for centralized API error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status || 0;
    const isAuthError = status === 401;

    if (isAuthError) {
      // Gracefully clear invalid / expired token
      localStorage.removeItem('hrms_token');

      const path = window.location.pathname;
      const isPublicPath =
        path === '/' ||
        path === '/login' ||
        path.endsWith('/login') ||
        path === '/system-health';

      const now = Date.now();
      if (now - lastAuthNoticeTime > 4000) {
        lastAuthNoticeTime = now;
        window.dispatchEvent(
          new CustomEvent('hrms:auth-expired', {
            detail: {
              message: 'Authentication required or session expired. Please sign in to continue.',
            },
          })
        );
      }

      // If on a protected route, safely redirect without infinite loops
      if (!isPublicPath && !isRedirecting) {
        isRedirecting = true;
        setTimeout(() => {
          isRedirecting = false;
          let redirectTarget = '/';
          if (path.startsWith('/admin')) redirectTarget = '/admin/login';
          else if (path.startsWith('/hr')) redirectTarget = '/hr/login';
          else if (path.startsWith('/manager')) redirectTarget = '/manager/login';
          else if (path.startsWith('/employee')) redirectTarget = '/employee/login';

          window.location.href = redirectTarget;
        }, 400);
      }
    }

    const isNetErr = !error.response || error.code === 'ERR_NETWORK';
    const customError = {
      status,
      message: isAuthError
        ? 'Authentication required. Please sign in to continue.'
        : error.response?.data?.message ||
          (isNetErr
            ? 'Network Error: Unable to reach HRMS backend server. Please verify backend is running on port 5000.'
            : error.message || 'Unknown network error'),
      data: error.response?.data || null,
      isNetworkError: isNetErr,
      isAuthError,
    };
    return Promise.reject(customError);
  }
);

export default api;
