const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorEmail: {
      type: String,
      default: null,
    },
    actorRole: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      required: [true, 'Audit log action is required.'],
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'Audit log entity type is required.'],
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Audit log description is required.'],
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for querying audit logs by date and entity
auditLogSchema.index({ entityType: 1, timestamp: -1 });
auditLogSchema.index({ actor: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
