const mongoose = require('mongoose');

/**
 * DonorProfile Schema — mirrors the relational Donor_Profile table:
 *   user_id (FK), blood_group, contact, photo, last_donation_date
 */
const donorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
    },
    blood_group: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: [true, 'Blood group is required'],
    },
    contact: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Contact must be a 10-digit number'],
    },
    photo: {
      type: String,
      default: '',
    },
    last_donation_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DonorProfile', donorProfileSchema);
