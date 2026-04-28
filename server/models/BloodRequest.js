const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Usually a Doctor, but keeping it flexible
      required: true,
    },
    blood_group: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    quantity: {
      type: Number, // units or ml
      required: true,
      default: 1,
    },
    urgency_level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    request_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'CLOSED', 'REVOKED'],
      default: 'OPEN',
    },
    selected_donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
