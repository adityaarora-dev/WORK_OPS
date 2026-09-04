const AuditLog = require('../models/AuditLog');

/**
 * Strips sensitive keys (passwords, tokens, credentials) from audit metadata.
 */
const sanitizeMetadata = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadata);
  }

  const clean = {};
  const sensitiveRegex = /password|token|secret|authorization|cookie|session|key/i;

  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveRegex.test(k)) {
      clean[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      clean[k] = sanitizeMetadata(v);
    } else {
      clean[k] = v;
    }
  }

  return clean;
};

/**
 * Non-blocking, failsafe audit event logger.
 * Safe to invoke anywhere in controllers or services without try/catch boilerplate.
 */
const logAuditEvent = async ({
  actor = null,
  actorEmail = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
  req = null,
}) => {
  try {
    let finalActor = actor;
    let finalEmail = actorEmail;
    let finalRole = actorRole;
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      if (!finalActor && req.user) {
        finalActor = req.user._id || req.user.id;
        finalEmail = req.user.email;
        finalRole = req.user.role;
      }
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
      userAgent = req.headers['user-agent'] || null;
    }

    const cleanMeta = sanitizeMetadata(metadata);

    await AuditLog.create({
      actor: finalActor,
      actorEmail: finalEmail,
      actorRole: finalRole,
      action: action.toUpperCase(),
      entityType,
      entityId: entityId ? String(entityId) : null,
      description,
      metadata: cleanMeta,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (err) {
    // Non-blocking failsafe: Log warning to console, do NOT disrupt core business flow
    console.warn(`[AuditService Warning] Failed to log audit event: ${err.message}`);
  }
};

/**
 * Retrieves audit logs with role-based filtering and pagination.
 */
const getAuditLogs = async ({
  actor,
  action,
  entityType,
  startDate,
  endDate,
  page = 1,
  limit = 20,
  userRole,
}) => {
  const query = {};

  // Role scoping: HR can only access HR/operational entity logs; Admin has full access
  if (userRole === 'hr') {
    query.entityType = {
      $in: [
        'Employee',
        'Department',
        'Attendance',
        'Leave',
        'Payroll',
        'PerformanceReview',
        'EmployeeGoal',
        'JobOpening',
        'JobApplication',
        'Interview',
        'EmployeeDocument',
      ],
    };
  }

  if (actor) {
    query.$or = [{ actor }, { actorEmail: new RegExp(actor, 'i') }];
  }

  if (action) {
    query.action = new RegExp(action, 'i');
  }

  if (entityType && (!query.entityType || query.entityType.$in.includes(entityType))) {
    query.entityType = entityType;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

module.exports = {
  logAuditEvent,
  getAuditLogs,
  sanitizeMetadata,
};
