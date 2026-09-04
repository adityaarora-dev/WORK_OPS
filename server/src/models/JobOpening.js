const mongoose = require('mongoose');

const JOB_STATUSES = ['draft', 'open', 'paused', 'closed'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'intern'];

const jobOpeningSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, 'Job ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: {
        values: EMPLOYMENT_TYPES,
        message: '{VALUE} is not a valid employment type',
      },
      default: 'full-time',
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    openings: {
      type: Number,
      default: 1,
      min: [1, 'Number of openings must be at least 1'],
    },
    requirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    status: {
      type: String,
      enum: {
        values: JOB_STATUSES,
        message: '{VALUE} is not a valid job status',
      },
      default: 'draft',
      index: true,
    },
    postedDate: {
      type: Date,
      default: null,
    },
    closingDate: {
      type: Date,
      default: null,
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

const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);

module.exports = {
  JobOpening,
  JOB_STATUSES,
  EMPLOYMENT_TYPES,
};
