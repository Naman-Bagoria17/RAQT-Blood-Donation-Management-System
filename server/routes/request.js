const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const DoctorProfile = require('../models/DoctorProfile');
const DonationRecord = require('../models/DonationRecord');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const sendEmail = require('../utils/sendEmail');

// ─────────────────────────────────────────────────────────────
// POST /api/request/create
// Create a new blood request (can be done by Donor or Doctor)
// ─────────────────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  try {
    const { blood_group, quantity, urgency_level } = req.body;

    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const request = await BloodRequest.create({
      requestId,
      requester: req.user.id,
      blood_group,
      quantity,
      urgency_level: urgency_level || 'MEDIUM',
    });

    // Notify all donors with the requested blood group
    const matchingProfiles = await DonorProfile.find({ blood_group }).populate('user');
    
    const docProfile = await DoctorProfile.findOne({ user: req.user.id }).populate('user');
    const hospitalName = docProfile && docProfile.hospital_name ? docProfile.hospital_name : 'a local hospital';
    const docName = docProfile && docProfile.user && docProfile.user.name ? `Dr. ${docProfile.user.name}` : 'A doctor';
    const contact = docProfile && docProfile.contact ? docProfile.contact : 'the hospital';

    for (const profile of matchingProfiles) {
      if (profile.user) {
        // Create in-app notification
        await Notification.create({
          user: profile.user._id,
          message: `A new emergency request for ${blood_group} blood has been created by ${docName} from ${hospitalName}. Contact: ${contact}. Request ID: ${requestId}.`,
          related_request: request._id,
        });

        // Send Email
        await sendEmail({
          to: profile.user.email,
          subject: `Urgent Blood Request: ${blood_group} Needed at ${hospitalName}`,
          text: `Hello ${profile.user.name},\n\nAn emergency request for ${blood_group} blood has been posted by ${docName} at ${hospitalName} (Contact: ${contact}).\nRequest ID: ${requestId}.\n\nIf you are eligible and available, please consider donating to help save a life.\n\nThank you,\nBloodConnect Team`
        });
      }
    }

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
    const requests = await BloodRequest.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
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
// GET /api/request/my-requests
// View all requests created by the logged in user
// ─────────────────────────────────────────────────────────────
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requester: req.user.id })
      .populate('selected_donor', 'name email')
      .sort({ request_date: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Get My Requests Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching your requests' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/request/revoke/:id
// Revoke an OPEN request
// ─────────────────────────────────────────────────────────────
router.put('/revoke/:id', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.id, requester: req.user.id });
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found or not authorized' });
    }

    if (request.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: 'Only OPEN requests can be revoked' });
    }

    request.status = 'REVOKED';
    await request.save();

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Revoke Request Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error revoking request' });
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
    if (status === 'IN_PROGRESS' && donor_id) {
      request.selected_donor = donor_id;
    }
    await request.save();

    // If marked IN_PROGRESS and a donor is selected, send them a notification and email
    if (status === 'IN_PROGRESS' && donor_id) {
      const donorUser = await User.findById(donor_id);
      
      const docProfile = await DoctorProfile.findOne({ user: req.user.id }).populate('user');
      const hospitalName = docProfile && docProfile.hospital_name ? docProfile.hospital_name : 'the hospital';
      const docName = docProfile && docProfile.user && docProfile.user.name ? `Dr. ${docProfile.user.name}` : 'A doctor';
      const contact = docProfile && docProfile.contact ? docProfile.contact : 'the hospital immediately';

      await Notification.create({
        user: donor_id,
        message: `You have been selected as an eligible donor for an emergency ${request.blood_group} request (ID: ${request.requestId}) by ${docName} at ${hospitalName}. Contact: ${contact}.`,
        related_request: request._id,
      });

      if (donorUser) {
        await sendEmail({
          to: donorUser.email,
          subject: `Urgent: You've been selected for a blood donation at ${hospitalName}`,
          text: `Hello ${donorUser.name},\n\nYou have been specifically selected by ${docName} as an eligible match for an emergency ${request.blood_group} blood request (Request ID: ${request.requestId}) at ${hospitalName}.\n\nPlease contact ${contact} immediately.\n\nThank you,\nBloodConnect Team`
        });
      }
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

// ─────────────────────────────────────────────────────────────
// PUT /api/request/complete/:id
// Complete a blood donation request
// ─────────────────────────────────────────────────────────────
router.put('/complete/:id', protect, authorize('doctor'), async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ _id: req.params.id, requester: req.user.id });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'Only IN_PROGRESS requests can be completed' });
    }

    if (!request.selected_donor) {
      return res.status(400).json({ success: false, message: 'No donor assigned to this request' });
    }

    request.status = 'CLOSED';
    await request.save();

    // Create Donation Record
    await DonationRecord.create({
      donor: request.selected_donor,
      hospital: req.user.id,
      quantity: request.quantity > 50 ? request.quantity : request.quantity * 350,
    });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Complete Request Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error completing request' });
  }
});

module.exports = router;
