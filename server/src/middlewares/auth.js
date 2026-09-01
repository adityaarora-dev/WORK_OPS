const { verifyToken } = require('../utils/jwt');
const { User } = require('../models/User');

/**
 * Middleware to authenticate requests using a Bearer JWT.
 * Validates token presence, cryptographic integrity, user existence, and active status.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization header provided.',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Format must be: Bearer <token>.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing from Bearer header.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User account has been deactivated.',
      });
    }

    // Attach safe user identity to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict route access based on user roles.
 *
 * @param {...string} allowedRoles - List of allowed role names (e.g. 'admin', 'hr')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    const userRole = (req.user.role || '').toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your role (${userRole}) does not have permission to access this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles,
};
