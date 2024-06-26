const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

// Register Admin
const registerAdmin = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ msg: "Admin already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const newAdmin = new Admin({
            email,
            username,
            password: hashedPassword
        });

        // Save admin to database
        await newAdmin.save();

        res.status(201).json({ msg: "Admin registered successfully" });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// Login Admin
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Generate JWT token
        const payload = {
            admin: {
                id: admin.id,
                email: admin.email
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { username: 1, _id: 0 }); // Only fetch usernames
        const usernames = users.map(user => user.username);
        res.json(usernames);
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};
const getUserByUsername = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// Delete user by username
const deleteUserByUsername = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        await user.remove();
        res.json({ msg: "User deleted successfully" });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getAllUsers,
    getUserByUsername,
    deleteUserByUsername
};