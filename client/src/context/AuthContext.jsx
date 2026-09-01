import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import { loginUser, getCurrentUser, logoutUser } from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hrms_token'));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('hrms_token')));
  const [authError, setAuthError] = useState(null);

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;
    const savedToken = localStorage.getItem('hrms_token');

    if (!savedToken) {
      return;
    }

    getCurrentUser()
      .then((response) => {
        if (isMounted) {
          setUser(response.data.user);
          setToken(savedToken);
          setAuthError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem('hrms_token');
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Logs the user in and persists token.
   */
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const response = await loginUser(email, password);
      const { user: loggedInUser, token: receivedToken } = response.data;

      localStorage.setItem('hrms_token', receivedToken);
      setUser(loggedInUser);
      setToken(receivedToken);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Logs out the user and clears state and storage.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('hrms_token');
      setUser(null);
      setToken(null);
      setAuthError(null);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
