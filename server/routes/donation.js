const express = require('express');
const router = express.Router();
const DonationRecord = require('../models/DonationRecord');
const DonorProfile = require('../models/DonorProfile');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// ─────────────────────────────────────────────────────────────
// POST /api/donation/add
// Add a new donation record and update last_donation_date
// ─────────────────────────────────────────────────────────────
router.post('/add', protect, authorize('donor'), async (req, res) => {
  try {
    const { hospital_id, donation_date, quantity } = req.body;

    // Create the donation record
    const donation = await DonationRecord.create({
      donor: req.user.id,
      hospital: hospital_id || null, // null implies external donation manually added
      donation_date: donation_date || Date.now(),
      quantity: quantity || 350,
    });

    // Update the donor's last_donation_date if this is the most recent
    const profile = await DonorProfile.findOne({ user: req.user.id });
    if (profile) {
      const newDate = new Date(donation.donation_date);
      if (!profile.last_donation_date || newDate > profile.last_donation_date) {
        profile.last_donation_date = newDate;
        await profile.save();
      }
    }

    res.status(201).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error('Add Donation Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error adding donation' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/donation/history
// Get donation history for the current user
// ─────────────────────────────────────────────────────────────
router.get('/history', protect, authorize('donor'), async (req, res) => {
  try {
    const donations = await DonationRecord.find({ donor: req.user.id })
      .populate('hospital', 'name')
      .sort({ donation_date: -1 });

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Get Donation History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching donations' });
  }
});

module.exports = router;
