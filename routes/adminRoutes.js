const express = require('express');
const router = express.Router();
const {  registerAdmin,
    loginAdmin,
    getAllUsers,
    getUserByUsername,
    deleteUserByUsername } = require('../controllers/adminController');
const { authenticateToken } = require('../models/auth');

router.post('/register', registerAdmin);

router.post('/login', loginAdmin);

router.get('/users', getAllUsers);

router.get('/users/:username', getUserByUsername);

router.delete('/users/:username', deleteUserByUsername);

module.exports = router;
