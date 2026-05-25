const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    kyc: {
      status: {
        type: String,
        enum: ['not_started', 'pending', 'verified', 'rejected'],
        default: 'not_started',
      },
      idType: {
        type: String,
        enum: ['aadhar', 'pan', 'passport', 'driving_license'],
      },
      idNumber: String,
      idDocument: String, // URL or file path
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
      verifiedAt: Date,
      rejectionReason: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked', 'closed'],
      default: 'inactive',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster lookups
customerSchema.index({ email: 1, phone: 1, customerId: 1 });

module.exports = mongoose.model('Customer', customerSchema);
