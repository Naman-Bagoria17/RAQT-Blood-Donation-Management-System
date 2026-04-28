const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// ─────────────────────────────────────────────────────────────
// POST /api/request/create
// Create a new blood request (can be done by Donor or Doctor)
// ─────────────────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  try {
    const { blood_group, quantity, urgency_level } = req.body;

    const request = await BloodRequest.create({
      requester: req.user.id,
      blood_group,
      quantity,
      urgency_level: urgency_level || 'MEDIUM',
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Create Request Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating request' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/request/all
// View all active blood requests (mostly for doctors)
// ─────────────────────────────────────────────────────────────
router.get('/all', protect, authorize('doctor'), async (req, res) => {
  try {
    const requests = await BloodRequest.find({ status: { $ne: 'CLOSED' } })
      .populate('requester', 'name email role')
      .sort({ request_date: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Get Requests Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching requests' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/request/status/:id
// Update status of a request
// ─────────────────────────────────────────────────────────────
router.put('/status/:id', protect, authorize('doctor'), async (req, res) => {
  try {
    const { status, donor_id } = req.body;
    
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    // If marked IN_PROGRESS and a donor is selected, send them a notification
    if (status === 'IN_PROGRESS' && donor_id) {
      await Notification.create({
        user: donor_id,
        message: `You have been selected as an eligible donor for an emergency ${request.blood_group} request. Please contact the hospital immediately.`,
        related_request: request._id,
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Update Request Status Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating request status' });
  }
});

module.exports = router;
