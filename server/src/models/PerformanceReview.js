const mongoose = require('mongoose');

const REVIEW_STATUSES = ['draft', 'submitted', 'acknowledged'];

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer reference is required'],
    },
    reviewCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PerformanceReviewCycle',
      required: [true, 'Review cycle is required'],
      index: true,
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },
    overallRating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    strengths: {
      type: String,
      trim: true,
      default: '',
    },
    weaknesses: {
      type: String,
      trim: true,
      default: '',
    },
    achievements: {
      type: String,
      trim: true,
      default: '',
    },
    areasForImprovement: {
      type: String,
      trim: true,
      default: '',
    },
    managerComments: {
      type: String,
      trim: true,
      default: '',
    },
    employeeComments: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: 'draft',
      index: true,
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

// Prevent duplicate review for the same employee in the same review cycle
performanceReviewSchema.index({ employee: 1, reviewCycle: 1 }, { unique: true });

const PerformanceReview = mongoose.model(
  'PerformanceReview',
  performanceReviewSchema
);

const RATING_LABELS = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding',
};

module.exports = {
  PerformanceReview,
  REVIEW_STATUSES,
  RATING_LABELS,
};
