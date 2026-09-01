const healthService = require('../services/health.service');

/**
 * Controller to handle GET /api/health
 * Returns the operational status of the Express server and MongoDB Atlas connection.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getHealth = (req, res, next) => {
  try {
    const health = healthService.getSystemHealth();
    return res.status(200).json(health);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
