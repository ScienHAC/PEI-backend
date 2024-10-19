const express = require('express');
const OTP = require('../Models/otp'); // Import the OTP model
const { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin, handleUserStatus, handleUserLogout, handleAdminStatus, handleUserForgotPassword, handleUserResetPassword } = require('../Controllers/user');
const signupMiddleware = require('../Middleware/signupMiddleware');
const loginMiddleware = require('../Middleware/loginMiddleware');
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const restrictToAdmin = require('../Middleware/adminMiddleware');
const { setUser } = require('../Services/auth');
const router = express.Router();

// Signup
router.post("/signup", handleUserSignup);
// Login
router.post("/login", handleUserLogin);
// Logout
router.get("/logout", handleUserLogout);
// Check user status
router.get("/status", restrictToLoggedInUserOnly, handleUserStatus);
// check admin status
router.get("/admin", restrictToLoggedInUserOnly, restrictToAdmin, handleAdminStatus);
// Verify OTP Signup
router.post('/verify-otp-signup', signupMiddleware, handleUserOtpSignup);
// Verify OTP Login
router.post('/verify-otp-login', loginMiddleware, handleUserOtpLogin);
// Forgot Password - Send OTP
router.post('/forgot-password', handleUserForgotPassword);
// Reset Password
router.post('/reset-password', handleUserResetPassword);

module.exports = router;