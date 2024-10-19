const express = require('express');
const OTP = require('../Models/otp'); // Import the OTP model
const { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin, handleUserStatus, handleUserLogout, handleAdminStatus, handleUserForgotPassword, handleUserResetPassword } = require('../Controllers/user');
const signupMiddleware = require('../Middleware/signupMiddleware');
const loginMiddleware = require('../Middleware/loginMiddleware');
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const restrictToAdmin = require('../Middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const { handleResearchPaperSubmission } = require('../Controllers/user');
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
//file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ storage });

// Submit Research Paper
router.post('/submit-paper', upload.single('file'), restrictToLoggedInUserOnly, handleResearchPaperSubmission);


module.exports = router;