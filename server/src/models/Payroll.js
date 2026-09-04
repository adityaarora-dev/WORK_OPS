const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'processed', 'paid', 'failed'];
const PAYMENT_METHODS = ['direct-deposit', 'bank-transfer', 'check', 'cash'];

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    payPeriod: {
      month: {
        type: Number,
        required: [true, 'Pay period month is required (1-12)'],
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: [true, 'Pay period year is required'],
        min: 2000,
        max: 2100,
      },
    },
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'direct-deposit',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
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

// Prevent duplicate payroll for the same employee in the same month & year
payrollSchema.index(
  { employee: 1, 'payPeriod.month': 1, 'payPeriod.year': 1 },
  { unique: true }
);

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = {
  Payroll,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
};
