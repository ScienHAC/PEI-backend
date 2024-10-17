const express = require('express');
const OTP = require('../Models/otp'); // Import the OTP model
const { handleUserSignup, handleUserLogin, handleUserOtp } = require('../Controllers/user');
const signupMiddleware = require('../Middleware/signupMiddleware');
const { setUser } = require('../Services/auth');
const router = express.Router();

// Signup
router.post("/signup", handleUserSignup);
// Login
router.post("/login", handleUserLogin);

// Verify OTP
router.post('/verify-otp', signupMiddleware, handleUserOtp);

module.exports = router;