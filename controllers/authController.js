const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Google Auth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register new user
exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

// Initiate verification
exports.initiateVerification = asyncHandler(async (req, res) => {
  const { userId, verificationMethod } = req.body;
  const result = await authService.initiateVerification(userId, verificationMethod);
  res.json(result);
});

// Verify user
exports.verify = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  const result = await authService.verifyUser(userId, code);
  const user = await authService.getUserById(userId);
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
  
  res.json({ 
    message: result.message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profilePicture: user.profilePicture
    }
  });
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  
  // Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
  
  res.json({ 
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profilePicture: user.profilePicture
    }
  });
});

// Mobile Google login
exports.mobileGoogleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ message: 'ID token is required' });
  }
  
  try {
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Process the user data from Google
    const userData = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      profilePicture: payload.picture
    };
    
    // Find or create user with Google data
    const user = await authService.processGoogleAuth(userData);
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    // Return token and user data
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// Mobile Facebook login
exports.mobileFacebookLogin = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required' });
  }
  
  try {
    // Verify Facebook token by making a request to the Graph API
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    
    const fbUser = response.data;
    
    // Process the user data from Facebook
    const userData = {
      facebookId: fbUser.id,
      name: fbUser.name,
      email: fbUser.email,
      profilePicture: fbUser.picture?.data?.url
    };
    
    // Find or create user with Facebook data
    const user = await authService.processFacebookAuth(userData);
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    // Return token and user data
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(401).json({ message: 'Invalid Facebook token' });
  }
});