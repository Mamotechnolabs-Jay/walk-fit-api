const express = require('express');
const router = express.Router();
const profileController = require('../controllers/userProfileController');
const { authmiddleware } = require('../middlewares/authMiddleware');

router.post('/create', authmiddleware, profileController.createOrUpdateProfile);


router.get('/get', authmiddleware, profileController.getProfile);

router.delete('/delete', authmiddleware, profileController.deleteProfile);

module.exports = router;