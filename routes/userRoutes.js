const express = require('express');
const router = express.Router();
const { createUser, verifyOtp, updateUserProfile, getAllUsers, loginUser,getUserDetails } = require('../controllers/userController');
const { authenticateToken } = require('../models/auth');

router.post('/register', createUser);

router.post('/login', authenticateToken,loginUser);
router.get('/users', getAllUsers);
router.post(`/verify`, verifyOtp);
router.put('/update', authenticateToken, updateUserProfile);
router.get('/profile', authenticateToken, getUserDetails);


module.exports = router;
