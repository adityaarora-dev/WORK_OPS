const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const employeeRoutes = require('./employee.routes');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/employees', employeeRoutes);

module.exports = router;


