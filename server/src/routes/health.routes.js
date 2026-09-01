const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint returning API and database status
 * @access  Public
 */
router.get('/', healthController.getHealth);

module.exports = router;
