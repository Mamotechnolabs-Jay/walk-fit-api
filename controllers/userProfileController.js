const asyncHandler = require('../utils/asyncHandler');
const profileService = require('../services/userProfileService');

exports.createOrUpdateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // Assuming you'll get userId from auth middleware
  const result = await profileService.createOrUpdateProfile(userId, req.body);
  
  if (result.isNew) {
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: result.profile
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result.profile
    });
  }
});

exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From auth middleware
  const profile = await profileService.getProfileByUserId(userId);
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

exports.deleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await profileService.deleteProfile(userId);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});