const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      required: [true, 'Department ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Campus',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

// Compound text index for search
departmentSchema.index({ name: 'text', description: 'text', location: 'text' });

const Department = mongoose.model('Department', departmentSchema);

module.exports = {
  Department,
};
