const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const DoctorProfile = require('../models/DoctorProfile');
const Location = require('../models/Location');

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Helper: Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Register a new Donor or Doctor
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, blood_group, contact, hospital_name } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password is hashed via pre-save hook in model)
    const user = await User.create({ name, email, password, role });

    // Create role-specific profile
    if (role === 'donor') {
      await DonorProfile.create({
        user: user._id,
        blood_group: blood_group || 'O+',
        contact: contact || '',
      });
    } else if (role === 'doctor') {
      await DoctorProfile.create({
        user: user._id,
        hospital_name: hospital_name || '',
        contact: contact || '',
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Authenticate user and return JWT
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, latitude, longitude } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update location if provided
    if (latitude && longitude) {
      await Location.findOneAndUpdate(
        { user: user._id },
        {
          coordinates: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          timestamp: Date.now(),
        },
        { upsert: true, new: true }
      );
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Logout (client-side token invalidation)
// ─────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  // JWT is stateless; logout is handled client-side by discarding the token.
  // For a more secure approach, implement a token blacklist with Redis.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear the token from client storage.',
  });
});

module.exports = router;
