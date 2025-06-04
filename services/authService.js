const User = require('../models/User');
const generateCode = require('../utils/generateCode');
const { sendVerificationEmail } = require('../helpers/emailHelper');
const { sendVerificationSMS } = require('../helpers/smsHelper');

exports.registerUser = async (userData) => {
  const { name, email, mobile, password } = userData;
  
  // Check if user exists
  let user = await User.findOne({ $or: [{ email }, { mobile }] });
  if (user) {
    // If user exists but is not verified, we can let them try again
    if (!user.isVerified) {
    
      user.name = name;
      user.password = password;
      await user.save();
      
      return { 
        message: 'User already registered but not verified. Please verify your account.',
        userId: user._id,
        email: user.email,
        mobile: user.mobile
      };
    }
    throw new Error('User already exists');
  }
  
  // Create new user without verification method yet
  user = new User({
    name,
    email,
    mobile,
    password
  });
  
  await user.save();
  
  return { 
    message: 'Registration successful. Please verify your account.',
    userId: user._id,
    email: user.email,
    mobile: user.mobile
  };
};

exports.initiateVerification = async (userId, verificationMethod) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  // Generate and save verification code
  const verificationCode = generateCode();
  user.verificationCode = verificationCode;
  user.verificationExpires = new Date(Date.now() + 10 * 60000);
  user.verificationMethod = verificationMethod;
  
  await user.save();
  
  // Send verification code based on method
  if (verificationMethod === 'email') {
    await sendVerificationEmail(user.email, verificationCode);
    return { 
      message: `Verification code sent to your email: ${user.email}`,
      userId: user._id 
    };
  } else if (verificationMethod === 'mobile') {
    await sendVerificationSMS(user.mobile, verificationCode);
    return { 
      message: `Verification code sent to your mobile: ${user.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`,
      userId: user._id 
    };
  }
  
  throw new Error('Invalid verification method');
};

exports.verifyUser = async (userId, code) => {
  const user = await User.findOne({
    _id: userId,
    verificationCode: code,
    verificationExpires: { $gt: Date.now() }
  });
  
  if (!user) throw new Error('Invalid or expired verification code');
  
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationExpires = undefined;
  
  await user.save();
  
  return { message: 'Account verified successfully' };
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');
  
  if (!user.isVerified) throw new Error('Account not verified');
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid credentials');
  
  return user;
};

// Add this new function to get user by ID for token generation
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
};