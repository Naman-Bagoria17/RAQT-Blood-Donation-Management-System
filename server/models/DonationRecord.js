const mongoose = require('mongoose');

const donationRecordSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null means it could be an external donation manually added by the donor
    },
    donation_date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    quantity: {
      type: Number, // in ml
      required: true,
      default: 350,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DonationRecord', donationRecordSchema);
