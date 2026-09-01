const { getDatabaseStatus, isDatabaseConnected } = require('../config/db');

/**
 * Service to aggregate system health status.
 * Reflects the live state of MongoDB and Express server.
 *
 * @returns {Object} Health check data
 */
const getSystemHealth = () => {
  const dbStatus = getDatabaseStatus();
  const dbConnected = isDatabaseConnected();

  return {
    success: dbConnected,
    message: dbConnected
      ? 'HR Management API is running'
      : 'HR Management API is running (Database disconnected)',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
  };
};

module.exports = {
  getSystemHealth,
};
