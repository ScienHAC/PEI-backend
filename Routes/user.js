const express = require('express');
const OTP = require('../Models/otp'); // Import the OTP model
const { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin, handleUserStatus } = require('../Controllers/user');
const signupMiddleware = require('../Middleware/signupMiddleware');
const loginMiddleware = require('../Middleware/loginMiddleware');
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const { setUser } = require('../Services/auth');
const router = express.Router();

// Signup
router.post("/signup", handleUserSignup);
// Login
router.post("/login", handleUserLogin);
// Check user status
router.get("/status", restrictToLoggedInUserOnly, handleUserStatus);

// Verify OTP
router.post('/verify-otp-signup', signupMiddleware, handleUserOtpSignup);
router.post('/verify-otp-login', loginMiddleware, handleUserOtpLogin);

module.exports = router;