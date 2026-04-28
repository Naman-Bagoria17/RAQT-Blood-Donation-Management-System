const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const DoctorProfile = require('../models/DoctorProfile');

// ─────────────────────────────────────────────────────────────
// GET /api/users/profile
// Fetch logged-in user details + role-specific profile
// Requires: JWT token
// ─────────────────────────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let profile = null;

    if (role === 'donor') {
      profile = await DonorProfile.findOne({ user: userId });
    } else if (role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: userId });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          createdAt: req.user.createdAt,
        },
        profile,
      },
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/profile
// Update logged-in user details + role-specific profile
// Requires: JWT token
// ─────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { name, blood_group, contact, photo, last_donation_date, hospital_name } = req.body;

    // Update base user name if provided
    if (name) {
      await User.findByIdAndUpdate(userId, { name }, { runValidators: true });
    }

    let updatedProfile = null;

    if (role === 'donor') {
      const updates = {};
      if (blood_group) updates.blood_group = blood_group;
      if (contact) updates.contact = contact;
      if (photo !== undefined) updates.photo = photo;
      if (last_donation_date) updates.last_donation_date = last_donation_date;

      updatedProfile = await DonorProfile.findOneAndUpdate(
        { user: userId },
        updates,
        { new: true, runValidators: true }
      );
    } else if (role === 'doctor') {
      const updates = {};
      if (hospital_name) updates.hospital_name = hospital_name;
      if (contact) updates.contact = contact;

      updatedProfile = await DoctorProfile.findOneAndUpdate(
        { user: userId },
        updates,
        { new: true, runValidators: true }
      );
    }

    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

module.exports = router;
