const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// GET /api/donors/search
// Search for nearest eligible donors
// Query params: blood_group, lat, lng
// ─────────────────────────────────────────────────────────────
router.get('/search', protect, authorize('doctor'), async (req, res) => {
  try {
    const { blood_group, lat, lng } = req.query;

    if (!blood_group || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'blood_group, lat, and lng are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // 1. Find nearest users using Location collection
    // 2. Lookup their DonorProfile
    // 3. Filter by blood_group
    // 4. Compute eligibility and filter dynamically

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distance', // Output distance in meters
          spherical: true,
        },
      },
      {
        $lookup: {
          from: 'donorprofiles', // Mongoose usually lowercases and pluralizes model names
          localField: 'user',
          foreignField: 'user',
          as: 'profile',
        },
      },
      {
        $unwind: '$profile',
      },
      {
        $match: {
          'profile.blood_group': blood_group,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        // Add eligibility status for sorting and filtering
        $addFields: {
          isEligible: {
            $cond: {
              if: { $eq: ['$profile.last_donation_date', null] },
              then: true,
              else: {
                $gte: [
                  { $subtract: [new Date(), '$profile.last_donation_date'] },
                  NINETY_DAYS_MS,
                ],
              },
            },
          },
        },
      },
      {
        // Filter out ineligible donors entirely
        $match: {
          isEligible: true,
        },
      },
      {
        $sort: { distance: 1 }, // Already only eligible, so just sort by distance
      },
      {
        $project: {
          distance: 1,
          isEligible: 1,
          'userInfo.name': 1,
          'userInfo.email': 1,
          'userInfo._id': 1,
          'profile.blood_group': 1,
          'profile.contact': 1,
          'profile.last_donation_date': 1,
        },
      },
    ];

    const results = await Location.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
});

module.exports = router;
