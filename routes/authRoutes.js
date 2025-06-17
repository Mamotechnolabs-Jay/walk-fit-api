const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Traditional auth routes
router.post('/register', authController.register);
router.post('/initiate-verification', authController.initiateVerification);
router.post('/verify', authController.verify);
router.post('/login', authController.login);

// Mobile OAuth routes
router.post('/mobile/google', authController.mobileGoogleLogin);
router.post('/mobile/facebook', authController.mobileFacebookLogin);

module.exports = router;