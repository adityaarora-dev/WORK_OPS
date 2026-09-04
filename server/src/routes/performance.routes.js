const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const performanceController = require('../controllers/performance.controller');

const router = express.Router();

// All performance routes require authenticated user
router.use(authenticateUser);

// ---------------------------------------------------------------------------
// Employee Personal Summary
// ---------------------------------------------------------------------------
router.get('/my', performanceController.getMyPerformance);

// ---------------------------------------------------------------------------
// Performance Cycles
// ---------------------------------------------------------------------------
router.get('/cycles', performanceController.getCycles);
router.get('/cycles/:id', performanceController.getCycleById);
router.post(
  '/cycles',
  authorizeRoles('admin', 'hr'),
  performanceController.createCycle
);
router.patch(
  '/cycles/:id',
  authorizeRoles('admin', 'hr'),
  performanceController.updateCycle
);

// ---------------------------------------------------------------------------
// Employee Goals
// ---------------------------------------------------------------------------
router.get('/goals', performanceController.getGoals);
router.get('/goals/:id', performanceController.getGoalById);
router.post('/goals', performanceController.createGoal);
router.patch('/goals/:id', performanceController.updateGoal);

// ---------------------------------------------------------------------------
// Performance Reviews
// ---------------------------------------------------------------------------
router.get('/reviews', performanceController.getReviews);
router.get('/reviews/:id', performanceController.getReviewById);
router.post(
  '/reviews',
  authorizeRoles('admin', 'hr', 'manager'),
  performanceController.createReview
);
router.patch('/reviews/:id', performanceController.updateReview);

module.exports = router;
