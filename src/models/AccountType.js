const mongoose = require('mongoose');

const accountTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['savings', 'current', 'fixed_deposit'],
      unique: true,
      required: true,
    },
    description: String,
    interestRate: {
      type: Number,
      default: 0,
    },
    minBalance: {
      type: Number,
      default: 0,
    },
    maxWithdrawal: {
      type: Number,
      default: null, // null = unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccountType', accountTypeSchema);
