const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/notifications
// Get all notifications for the current user
// ─────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('related_request')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error('Get Notifications Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/notifications/read/:id
// Mark notification as read
// ─────────────────────────────────────────────────────────────
router.put('/read/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: 'READ' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Update Notification Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
});

module.exports = router;
