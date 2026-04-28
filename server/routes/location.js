const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// PUT /api/location/update
// Update the current user's location manually
// ─────────────────────────────────────────────────────────────
router.put('/update', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const location = await Location.findOneAndUpdate(
      { user: req.user.id },
      {
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        timestamp: Date.now(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Location Update Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
});

module.exports = router;
