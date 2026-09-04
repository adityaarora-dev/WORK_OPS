const auditService = require('../services/audit.service');

const getAuditLogs = async (req, res, next) => {
  try {
    const userRole = (req.user.role || '').toLowerCase();

    // Guard: Only Admin and HR are permitted to view audit logs
    if (userRole !== 'admin' && userRole !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Audit logs are restricted to Administrator and HR roles.',
      });
    }

    const result = await auditService.getAuditLogs({
      actor: req.query.actor,
      action: req.query.action,
      entityType: req.query.entityType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit,
      userRole,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs,
};
