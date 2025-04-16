// File: controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phoneNumber, 
      role,
      companyName,
      businessRegistrationNumber,
      resumeUrl
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Validate required fields based on role
    if (role === 'employer' && (!companyName || !businessRegistrationNumber)) {
      return res.status(400).json({ 
        message: 'Company name and business registration number are required for employers' 
      });
    }
    
    if (role === 'employee' && !resumeUrl) {
      return res.status(400).json({ 
        message: 'Resume URL is required for employees' 
      });
    }
    
    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      role,
      ...(role === 'employer' && { companyName, businessRegistrationNumber }),
      ...(role === 'employee' && { resumeUrl })
    });
    
    if (user) {
      // Generate JWT token
      const token = generateToken(user._id);
      
      // Return user data and token
      res.status(201).json({
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          profilePicture: 'https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E',
          bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          rating: 4.5,
          role: user.role,
          ...(user.role === 'employer' && { 
            companyName: user.companyName,
            businessRegistrationNumber: user.businessRegistrationNumber 
          }),
          ...(user.role === 'employee' && { 
            resumeUrl: user.resumeUrl 
          })
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check for user email
    const user = await User.findOne({ email });
    
    // If user exists and password matches
    if (user && (await user.comparePassword(password))) {
      // Generate JWT token
      const token = generateToken(user._id);
      
      res.json({
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          profilePicture: 'https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E',
          bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          rating: 4.5,
          role: user.role,
          ...(user.role === 'employer' && { 
            companyName: user.companyName,
            businessRegistrationNumber: user.businessRegistrationNumber 
          }),
          ...(user.role === 'employee' && { 
            resumeUrl: user.resumeUrl 
          })
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /auth/users/:id
// @access  Public
const getUserProfile = async (req, res) => {

  console.log('Fetching user profile for ID:', req.params.id);
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: 'https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E',
        bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        rating: 4.5,
        role: user.role,
        ...(user.role === 'employer' && { 
          companyName: user.companyName,
          businessRegistrationNumber: user.businessRegistrationNumber 
        }),
        ...(user.role === 'employee' && { 
          resumeUrl: user.resumeUrl 
        })
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {

    console.log("me :", req.user._id);
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Return user data in the format expected by the Flutter app
    res.json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: 'https://unsplash.com/photos/silhouette-of-man-illustration-2LowviVHZ-E',
        bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        rating: 4.5,
        role: user.role,
        ...(user.role === 'employer' && { 
          companyName: user.companyName,
          businessRegistrationNumber: user.businessRegistrationNumber 
        }),
        ...(user.role === 'employee' && { 
          resumeUrl: user.resumeUrl 
        }),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getMe
};
