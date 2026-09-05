const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP dispatch'],
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    otp: {
      type: String,
      required: [true, 'OTP code is required'],
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'login', 'password_reset'],
      default: 'registration',
    },
    tempData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    // Document expires automatically in 10 minutes (600 seconds)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600,
    },
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.model('Otp', otpSchema);

module.exports = { Otp };
