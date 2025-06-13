const ChallengeService = require('../services/challengeService');

// GET all available challenges
exports.getAllChallenges = async (req, res) => {
  try {
    const challenges = await ChallengeService.getAllChallenges();
    res.status(200).json({ success: true, data: challenges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET user's challenges (active/completed)
exports.getUserChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const status = req.query.status || 'active';
    const challenges = await ChallengeService.getUserChallenges(userId, status);
    res.status(200).json({ success: true, data: challenges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST enroll in a challenge
exports.enrollInChallenge = async (req, res) => {
  try {
    const userId = req.user._id;
    const { challengeId } = req.body;
    const enrollment = await ChallengeService.enrollUserInChallenge(userId, challengeId);
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT update daily progress
exports.updateDailyProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { challengeId, day, achievedValue } = req.body;
    const enrollment = await ChallengeService.updateDailyProgress(userId, challengeId, day, achievedValue);
    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT mark challenge as completed/failed/abandoned
exports.markChallengeStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { challengeId, status } = req.body;
    const enrollment = await ChallengeService.markChallengeStatus(userId, challengeId, status);
    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST auto-assign challenges based on user profile
exports.autoAssignChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const enrollments = await ChallengeService.autoAssignChallengesForUser(userId);
    res.status(201).json({ success: true, data: enrollments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST generate and assign walking challenges for a user (auto-generate from API)
exports.generateAndAssignWalkingChallenges = async (req, res) => {
  try {
    const userId = req.user._id;
    const enrollments = await ChallengeService.generateAndAssignWalkingChallenges(userId);
    res.status(201).json({ success: true, data: enrollments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
