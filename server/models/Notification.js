const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // The recipient
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['UNREAD', 'READ'],
      default: 'UNREAD',
    },
    related_request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
