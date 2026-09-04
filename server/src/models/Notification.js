const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient user is required.'],
      index: true,
    },
    type: {
      type: String,
      enum: ['leave', 'attendance', 'payroll', 'performance', 'recruitment', 'document', 'system'],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required.'],
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required.'],
      trim: true,
      maxlength: 1000,
    },
    relatedEntity: {
      type: String,
      enum: ['Leave', 'Attendance', 'Payroll', 'PerformanceReview', 'EmployeeGoal', 'JobOpening', 'JobApplication', 'Interview', 'EmployeeDocument', 'Employee', 'Department', 'User', null],
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user notifications sorted by creation date
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
