const mongoose = require('mongoose');

const APPLICATION_STAGES = [
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offer',
  'Hired',
  'Rejected',
];

const APPLICATION_STATUSES = ['active', 'hired', 'rejected', 'withdrawn'];

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: [true, 'Application ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate reference is required'],
      index: true,
    },
    jobOpening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: [true, 'Job Opening reference is required'],
      index: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    currentStage: {
      type: String,
      enum: {
        values: APPLICATION_STAGES,
        message: '{VALUE} is not a valid recruitment stage',
      },
      default: 'Applied',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: '{VALUE} is not a valid application status',
      },
      default: 'active',
      index: true,
    },
    assignedRecruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    convertedToEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    conversionDate: {
      type: Date,
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

// Prevent duplicate application by same candidate for the same job opening
jobApplicationSchema.index({ candidate: 1, jobOpening: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = {
  JobApplication,
  APPLICATION_STAGES,
  APPLICATION_STATUSES,
};
