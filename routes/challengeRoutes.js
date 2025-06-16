const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authmiddleware } = require('../middlewares/authMiddleware');

// Get all available challenges
router.get('/', authmiddleware, challengeController.getAllChallenges);

// Get user's challenges (active/completed/failed)
router.get('/user', authmiddleware, challengeController.getUserChallenges);

// Enroll in a challenge
router.post('/enroll', authmiddleware, challengeController.enrollInChallenge);

// Update daily progress
router.put('/progress', authmiddleware, challengeController.updateDailyProgress);

// Mark challenge as completed/failed/abandoned
router.put('/status', authmiddleware, challengeController.markChallengeStatus);

// Generate and assign walking challenges from API for a user
router.post('/generate-auto-walking-challenges', authmiddleware, challengeController.generateAndAssignWalkingChallenges);

module.exports = router;
