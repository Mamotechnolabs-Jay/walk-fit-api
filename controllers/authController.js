const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});


exports.initiateVerification = asyncHandler(async (req, res) => {
  const { userId, verificationMethod } = req.body;
  const result = await authService.initiateVerification(userId, verificationMethod);
  res.json(result);
});

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
      mobile: user.mobile
    }
  });
});

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
      mobile: user.mobile
    }
  });
});