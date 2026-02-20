const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadProfilePhoto_middleware = require('../middleware/uploadProfilePhoto');
const {
  getMyProfile,
  getProfileCompletion,
  uploadProfilePhoto,
  deleteProfilePhoto,
  updateOwnProfile,
} = require('../controllers/employeeController');
const { getMe, changePassword } = require('../controllers/authController');

// All routes require authentication
router.use(protect);

// Current user info (auth context)
router.get('/me', getMe);

// Profile
router.get('/profile', getMyProfile);
router.put('/profile', updateOwnProfile);
router.get('/profile-completion', getProfileCompletion);

// Profile photo
router.post('/profile-photo', uploadProfilePhoto_middleware.single('file'), uploadProfilePhoto);
router.delete('/profile-photo', deleteProfilePhoto);

// Password
router.put('/change-password', changePassword);

module.exports = router;
