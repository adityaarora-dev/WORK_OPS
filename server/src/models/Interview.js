const mongoose = require('mongoose');

const INTERVIEW_MODES = ['in-person', 'video', 'phone'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'];

const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: [true, 'Interview ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: [true, 'Application reference is required'],
      index: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Interviewer reference is required'],
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Interview scheduled date and time is required'],
    },
    duration: {
      type: Number,
      default: 45,
      min: [15, 'Interview duration must be at least 15 minutes'],
      max: [240, 'Interview duration cannot exceed 240 minutes'],
    },
    mode: {
      type: String,
      enum: {
        values: INTERVIEW_MODES,
        message: '{VALUE} is not a valid interview mode',
      },
      default: 'video',
    },
    location: {
      type: String,
      trim: true,
      default: 'Google Meet',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: INTERVIEW_STATUSES,
        message: '{VALUE} is not a valid interview status',
      },
      default: 'scheduled',
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

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = {
  Interview,
  INTERVIEW_MODES,
  INTERVIEW_STATUSES,
};
