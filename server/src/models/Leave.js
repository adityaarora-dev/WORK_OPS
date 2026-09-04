const mongoose = require('mongoose');

const LEAVE_TYPES = ['casual', 'sick', 'earned', 'unpaid', 'other'];
const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      required: [true, 'Leave type is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Leave must be at least 1 day'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: LEAVE_STATUSES,
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewComment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = {
  Leave,
  LEAVE_TYPES,
  LEAVE_STATUSES,
};
