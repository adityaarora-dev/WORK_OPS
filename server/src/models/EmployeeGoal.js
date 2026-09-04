const mongoose = require('mongoose');

const GOAL_PRIORITIES = ['low', 'medium', 'high'];
const GOAL_STATUSES = ['not_started', 'in_progress', 'completed', 'cancelled'];

const employeeGoalSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    priority: {
      type: String,
      enum: GOAL_PRIORITIES,
      default: 'medium',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be less than 0%'],
      max: [100, 'Progress cannot exceed 100%'],
      default: 0,
    },
    status: {
      type: String,
      enum: GOAL_STATUSES,
      default: 'not_started',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PerformanceReviewCycle',
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

// Auto-update status when progress changes
employeeGoalSchema.pre('save', function () {
  if (this.progress === 100 && this.status !== 'cancelled') {
    this.status = 'completed';
  } else if (this.progress > 0 && this.progress < 100 && this.status === 'not_started') {
    this.status = 'in_progress';
  }
});

const EmployeeGoal = mongoose.model('EmployeeGoal', employeeGoalSchema);

module.exports = {
  EmployeeGoal,
  GOAL_PRIORITIES,
  GOAL_STATUSES,
};
