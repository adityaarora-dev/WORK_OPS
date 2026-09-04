const performanceService = require('../services/performance.service');

// ============================================================================
// PERFORMANCE CYCLES
// ============================================================================

const getCycles = async (req, res, next) => {
  try {
    const result = await performanceService.getCycles({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Review cycles retrieved successfully.',
      data: result.cycles,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getCycleById = async (req, res, next) => {
  try {
    const cycle = await performanceService.getCycleById(req.params.id);
    return res.status(200).json({
      success: true,
      data: cycle,
    });
  } catch (error) {
    next(error);
  }
};

const createCycle = async (req, res, next) => {
  try {
    const cycle = await performanceService.createCycle({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Review cycle created successfully.',
      data: cycle,
    });
  } catch (error) {
    next(error);
  }
};

const updateCycle = async (req, res, next) => {
  try {
    const cycle = await performanceService.updateCycle({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Review cycle updated successfully.',
      data: cycle,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// EMPLOYEE GOALS
// ============================================================================

const getGoals = async (req, res, next) => {
  try {
    const result = await performanceService.getGoals({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Employee goals retrieved successfully.',
      data: result.goals,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getGoalById = async (req, res, next) => {
  try {
    const goal = await performanceService.getGoalById({
      id: req.params.id,
      user: req.user,
    });
    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const goal = await performanceService.createGoal({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Goal assigned successfully.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await performanceService.updateGoal({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Goal updated successfully.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PERFORMANCE REVIEWS
// ============================================================================

const getReviews = async (req, res, next) => {
  try {
    const result = await performanceService.getReviews({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json({
      success: true,
      message: 'Performance reviews retrieved successfully.',
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewById = async (req, res, next) => {
  try {
    const review = await performanceService.getReviewById({
      id: req.params.id,
      user: req.user,
    });
    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const review = await performanceService.createReview({
      user: req.user,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Performance review submitted successfully.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await performanceService.updateReview({
      id: req.params.id,
      user: req.user,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Performance review updated successfully.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// EMPLOYEE SELF SERVICE
// ============================================================================

const getMyPerformance = async (req, res, next) => {
  try {
    const result = await performanceService.getMyPerformance({
      user: req.user,
    });
    return res.status(200).json({
      success: true,
      message: 'Personal performance summary retrieved successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Cycles
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  // Goals
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  // Reviews
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  // My Performance
  getMyPerformance,
};
