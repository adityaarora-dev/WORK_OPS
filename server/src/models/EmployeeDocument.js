const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'resume',
  'offer-letter',
  'contract',
  'id-proof',
  'address-proof',
  'certificate',
  'tax-form',
  'other',
];

const documentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true,
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: [true, 'Document type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    storedFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
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

const EmployeeDocument = mongoose.model('EmployeeDocument', documentSchema);

module.exports = {
  EmployeeDocument,
  DOCUMENT_TYPES,
};
