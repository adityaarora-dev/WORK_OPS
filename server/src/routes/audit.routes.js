const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const auditController = require('../controllers/audit.controller');

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeRoles('admin', 'hr'));

router.get('/', auditController.getAuditLogs);

module.exports = router;
