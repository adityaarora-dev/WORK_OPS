const jwt = require('jsonwebtoken');

/**
 * Signs a JWT with only safe user identity information.
 *
 * @param {Object} user - User document or user info
 * @returns {string} Signed JWT string
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  const payload = {
    id: user._id ? user._id.toString() : user.id,
    role: user.role,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies a JWT and decodes its payload.
 *
 * @param {string} token - JWT string
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
