const mongoose = require('mongoose');

const CYCLE_STATUSES = ['draft', 'active', 'completed', 'archived'];

const performanceReviewCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cycle name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: CYCLE_STATUSES,
      default: 'active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

const PerformanceReviewCycle = mongoose.model(
  'PerformanceReviewCycle',
  performanceReviewCycleSchema
);

module.exports = {
  PerformanceReviewCycle,
  CYCLE_STATUSES,
};
