const { User } = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Handles user login.
 * Validates credentials and issues a secure JWT token.
 *
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user by normalized email and explicitly include password for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user);

    // Return safe user representation (password automatically excluded via toJSON)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the currently authenticated user's profile.
 *
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user logout.
 * For stateless JWT tokens, client clears the token; server confirms invalidation.
 *
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public employee registration endpoint.
 * Note: Privileged roles (admin, hr, manager) CANNOT be set through this endpoint;
 * any public registration is strictly assigned role: 'employee'.
 *
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { employeeId, firstName, lastName, email, password } = req.body;

    if (!employeeId || !firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (employeeId, firstName, lastName, email, password) are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmpId = employeeId.trim().toUpperCase();

    // Check if email or employeeId already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { employeeId: normalizedEmpId }],
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Employee ID';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    // Role is strictly forced to 'employee'
    const newUser = await User.create({
      employeeId: normalizedEmpId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      role: 'employee',
      isActive: true,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        user: newUser.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  logout,
  register,
};
