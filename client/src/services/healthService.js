import api from './api';

/**
 * Health service to fetch backend and database status.
 *
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   database: string,
 *   timestamp: string,
 *   uptime: string,
 *   environment: string
 * }>}
 */
export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};
