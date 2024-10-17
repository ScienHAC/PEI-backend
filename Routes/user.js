const express = require('express');
const OTP = require('../Models/otp'); // Import the OTP model
const { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin } = require('../Controllers/user');
const signupMiddleware = require('../Middleware/signupMiddleware');
const loginMiddleware = require('../Middleware/loginMiddleware');
const { setUser } = require('../Services/auth');
const router = express.Router();

// Signup
router.post("/signup", handleUserSignup);
// Login
router.post("/login", handleUserLogin);

// Verify OTP
router.post('/verify-otp-signup', signupMiddleware, handleUserOtpSignup);
router.post('/verify-otp-login', loginMiddleware, handleUserOtpLogin);

module.exports = router;