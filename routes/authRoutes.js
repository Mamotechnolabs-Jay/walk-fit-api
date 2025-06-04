const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/initiate-verification', authController.initiateVerification);
router.post('/verify', authController.verify);
router.post('/login', authController.login);

module.exports = router;