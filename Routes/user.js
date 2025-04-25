const express = require('express');
const OTP = require('../Models/otp'); // Import the OTP model
const { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin, handleUserStatus, handleUserLogout, handleAdminStatus, handleUserForgotPassword, handleUserResetPassword, handleContactUs } = require('../Controllers/user');
const signupMiddleware = require('../Middleware/signupMiddleware');
const loginMiddleware = require('../Middleware/loginMiddleware');
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const restrictToAdmin = require('../Middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const { handleResearchPaperSubmission } = require('../Controllers/user');
const { setUser } = require('../Services/auth');
const router = express.Router();
const puppeteer = require('puppeteer');
const mammoth = require('mammoth');

// Signup
router.post("/signup", handleUserSignup);
// Login
router.post("/login", handleUserLogin);
// Logout
router.post("/logout", handleUserLogout);
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
// **file upload **
// Storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, 'uploads/pdf/');
        } else if (file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, 'uploads/doc/');
        } else {
            cb(null, 'uploads/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = file.mimetype === 'application/pdf' ? '.pdf' : path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});


const upload = multer({ storage });

// Middleware for handling `.doc` or `.docx` conversion
const convertDocToPdf = async (req, res, next) => {
    if (req.file && (req.file.mimetype === 'application/msword' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const pdfPath = `uploads/pdf/${req.file.filename.replace(path.extname(req.file.originalname), '.pdf')}`;

        try {
            // Convert DOCX to HTML
            const result = await mammoth.convertToHtml({ path: req.file.path });
            const htmlContent = result.value;

            // Convert HTML to PDF using Puppeteer
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Needed for running in some environments
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent);
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                margin: {
                    top: '40px',
                    right: '40px',
                    bottom: '40px',
                    left: '40px'
                }
            });
            await browser.close();

            req.file.convertedPath = pdfPath;
            next();
        } catch (error) {
            console.error('PDF conversion error:', error);
            return res.status(500).json({ message: 'Failed to convert document to PDF.' });
        }
    } else {
        next();
    }
};

// Use conversion middleware before handling paper submission
router.post('/submit-paper', upload.single('file'), convertDocToPdf, restrictToLoggedInUserOnly, handleResearchPaperSubmission);

//contact us
router.post('/contact-us', handleContactUs);

module.exports = router;