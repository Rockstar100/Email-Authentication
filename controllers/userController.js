const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');
const { randomBytes } = require('crypto');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Create User and Send OTP
const createUser = async (req, res) => {
    const { email, password, username } = req.body;
    console.log(req.body);

    try {
        // Check if the user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP and expiration time
        const otp = randomBytes(4).toString('hex');
        const otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes in the future

        // Save the OTP to Supabase
        const { error: supabaseError } = await supabase
            .from('email_otp')
            .insert([{ email, otp, otp_expires: otpExpires.toISOString() }]);

        if (supabaseError) {
            console.error('Supabase Error:', supabaseError);
            return res.status(400).json({ msg: "Error saving OTP to Supabase", details: supabaseError.message });
        }

        const user = new userModel({
            email,
            password: hashedPassword,
            username,
            status: 'pending'
        });
        await user.save();

        // Send OTP email
        const inviteLink = `http://localhost:5001/api/user/verify?otp=${otp}&email=${email}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Verify your email address',
            html: `
                <p>Hello! Please verify your email using this link.</p>
                <p>Your verification link:</p>
                <p>Click <a href="${inviteLink}">here</a> to verify.</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in sending email:', error);
                return res.status(500).json({ error: 'Error sending email' });
            } else {
                console.log('Email sent:', info.response);
                return res.status(201).json({ message: 'Email sent successfully', inviteLink: inviteLink });
            }
        });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// Verify OTP and Activate User
const verifyOtp = async (req, res) => {
    const { email, otp } = req.query;
    console.log(email, otp);

    try {
        // Fetch the OTP record from Supabase
        const { data: otpData, error: supabaseError } = await supabase
            .from('email_otp')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .single();

        if (supabaseError || !otpData) {
            return res.status(400).json({ msg: "Invalid or expired OTP." });
        }

        // Parse the OTP expiration date and ensure it's in UTC
        const otpExpiryDate = new Date(otpData.otp_expires + 'Z'); // Append 'Z' to ensure UTC

        console.log('Parsed OTP Expiry Date (UTC):', otpExpiryDate.toISOString());

        // Check if the OTP is expired
        if (new Date() > otpExpiryDate) {
            return res.status(400).json({ msg: "OTP has expired." });
        }

        // Update user status to active
        let user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "User not found." });
        }

        user.status = 'active';
        user = await user.save(); // Save updated user status

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ 
                msg: "Email verified successfully.",
                token

             });
        });

        // Delete the OTP entry after successful verification
        await supabase
            .from('email_otp')
            .delete()
            .eq('email', email);

    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

// Update User Profile Route (Protected Route)
const updateUserProfile = async (req, res) => {
    const { name, location, age, work, dob, description } = req.body;
    const userId = req.user.user.id; 
    try {
        // Find the user by ID
        let user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found." });
        }

        // Update alluser details

        user = await userModel.findOneAndUpdate({ _id: userId }, {
            name,
            location,
            age,
            work,
            dob,
            description
        }, { new: true }
        )

        await user.save();

        res.json({ msg: "User profile updated successfully." });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        res.json(users);
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

const loginUser = async (req, res) => {
    const { emailOrUsername, password } = req.body;
    try {
        // Find the user by email or username
        let user = await userModel.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Check if the user is verified
        if (user.status !== 'active') {
            return res.status(400).json({ msg: "Please verify your email." });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

const getUserDetails = async (req, res) => {
    console.log(req.user);
    try {
        // Extract user ID from the token
        const userId = req.user.user.id;

        // Find the user by ID
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Return user details
        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            location: user.location,
            age: user.age,
            work: user.work,
            dob: user.dob,
            description: user.description,
            status: user.status
            // Add more fields as per your user schema
        });
    } catch (err) {
        console.error('Server Error:', err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createUser,
    verifyOtp,
    updateUserProfile,
    getAllUsers,
    loginUser,
    getUserDetails
};
