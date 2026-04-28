const mongoose = require('mongoose');

/**
 * DoctorProfile Schema — mirrors the relational Doctor_Profile table:
 *   user_id (FK), hospital_name, contact
 */
const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
    },
    hospital_name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Contact must be a 10-digit number'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
