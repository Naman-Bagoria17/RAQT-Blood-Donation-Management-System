const express = require('express');
const router = express.Router();
const DonorProfile = require('../models/DonorProfile');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// 90 days in milliseconds
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Helper to compute eligibility
const computeEligibility = (last_donation_date) => {
  if (!last_donation_date) return true;
  return (Date.now() - new Date(last_donation_date).getTime()) >= NINETY_DAYS_MS;
};

// ─────────────────────────────────────────────────────────────
// GET /api/donor/profile
// Get donor profile with computed eligibility
// ─────────────────────────────────────────────────────────────
router.get('/profile', protect, authorize('donor'), async (req, res) => {
  try {
    const profile = await DonorProfile.findOne({ user: req.user.id }).populate('user', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const isEligible = computeEligibility(profile.last_donation_date);

    res.status(200).json({
      success: true,
      data: {
        ...profile.toObject(),
        eligibility_status: isEligible,
      },
    });
  } catch (error) {
    console.error('Get Donor Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/donor/eligibility
// Get strictly the donor's eligibility status
// ─────────────────────────────────────────────────────────────
router.get('/eligibility', protect, authorize('donor'), async (req, res) => {
  try {
    const profile = await DonorProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const isEligible = computeEligibility(profile.last_donation_date);

    res.status(200).json({
      success: true,
      eligible: isEligible,
      last_donation_date: profile.last_donation_date,
    });
  } catch (error) {
    console.error('Get Eligibility Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error computing eligibility' });
  }
});

module.exports = router;
