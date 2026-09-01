import { useState, useEffect, useCallback } from 'react';
import { getHealthStatus } from '../services/healthService';

/**
 * Custom hook to monitor API and database health status.
 * Provides live data, loading indicators, error tracking, and manual refresh.
 */
export const useHealth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const healthData = await getHealthStatus();
      setData(healthData);
      setError(null);
    } catch (err) {
      setError(
        err.message ||
        'Unable to connect to the backend server. Please verify Express is running on port 5000.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getHealthStatus()
      .then((healthData) => {
        if (isMounted) {
          setData(healthData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.message ||
            'Unable to connect to the backend server. Please verify Express is running on port 5000.'
          );
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchHealth,
  };
};

export default useHealth;
