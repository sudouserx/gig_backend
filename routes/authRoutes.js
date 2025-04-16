// File: routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Register a new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get user profile
router.get('/users/:id', getUserProfile);

// Get current authenticated user (for Flutter app)
router.get('/me', protect, getMe);

// Add logout route
router.post('/logout', protect, (req, res) => {
  // We don't need server-side logout logic with JWT
  // The client will handle token removal
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});


module.exports = router;
