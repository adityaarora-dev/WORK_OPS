const mongoose = require('mongoose');

const CANDIDATE_SOURCES = ['LinkedIn', 'Referral', 'Career Portal', 'Agency', 'Direct', 'Other'];
const CANDIDATE_STATUSES = ['new', 'in_review', 'interviewing', 'offered', 'hired', 'rejected'];

const candidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: [true, 'Candidate ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience years cannot be negative'],
    },
    education: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: {
        values: CANDIDATE_SOURCES,
        message: '{VALUE} is not a valid candidate source',
      },
      default: 'Direct',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: CANDIDATE_STATUSES,
        message: '{VALUE} is not a valid candidate status',
      },
      default: 'new',
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

candidateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = {
  Candidate,
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
};
