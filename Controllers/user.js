const User = require('../Models/user');
const { setUser } = require('../Services/auth');
const nodemailer = require('nodemailer');
const OTP = require('../Models/otp');
const bcrypt = require('bcrypt');
const ResearchPaper = require('../Models/ResearchPaper');
const path = require('path');

let handleUserSignup = async (req, res) => {
    try {
        const { name, email, password, contact } = req.body;
        if (!name || !email || !password || !contact) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        // Store OTP and user data temporarily in the OTP collection
        await OTP.create({ email, otp });

        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        });

        res.status(200).json({ message: 'Signup successful. Please verify your OTP.' });
    } catch (error) {
        console.error('OTP email error:', error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};


let handleUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        // Store OTP and user data temporarily in the OTP collection
        await OTP.create({ email, otp });

        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        });

        res.status(200).json({ message: 'Login successful. Please verify your OTP.' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

let handleUserOtpSignup = async (req, res) => {
    await User.init();
    const { otp } = req.body;
    const { name, email, password, contact } = req.tempUser;
    try {
        const otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }


        const newUserDoc = await User.create({
            name,
            email,
            password: password,
            contact,
        });

        await OTP.deleteOne({ _id: otpRecord._id });

        const token = setUser(newUserDoc);

        res.cookie('_auth_token_pei', token, {
            httpOnly: true, secure: true, sameSite: 'None', maxAge: 7 * 24 * 60 * 60 * 1000 //localhost put secure true is samesite none
        });

        return res.status(200).json({ message: 'OTP verified! User registered successfully.' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



let handleUserOtpLogin = async (req, res) => {
    const { otp } = req.body;
    const { email } = req.Client_User;
    try {
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        const user = await User.findOne({ email });
        console.log("Login Successfully");

        await OTP.deleteOne({ _id: otpRecord._id });

        const token = setUser(user);

        res.cookie('_auth_token_pei', token, {
            httpOnly: true, secure: true, sameSite: 'None', maxAge: 7 * 24 * 60 * 60 * 1000 //localhost put secure true is samesite none
        });

        return res.status(200).json({ message: 'OTP verified! User Logged successfully.' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

let handleUserStatus = async (req, res) => {
    res.json({ user: req.user, isAuthenticated: true });
}

let handleUserLogout = async (req, res) => {
    res.clearCookie('_auth_token_pei');
    res.json({ message: 'Logged out successfully' });
}

let handleAdminStatus = async (req, res) => {
    res.send(`Welcome Admin, ${req.user.email}!`);
}


let handleUserForgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Store OTP in the OTP collection
        await OTP.create({ email, otp });

        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your Password Reset OTP',
            text: `Your OTP code for password reset is ${otp}. It is valid for 10 minutes.`,
        });

        return res.status(200).json({ message: 'OTP sent to your email!' });
    } catch (error) {
        console.error('Forgot Password error:', error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};

let handleUserResetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Verify OTP
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await User.updateOne({ email }, { password: hashedPassword });

        // Delete OTP record
        await OTP.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ message: 'Password reset successful!' });
    } catch (error) {
        console.error('Reset Password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// Handle file upload and research paper submission
const handleResearchPaperSubmission = async (req, res) => {
    const { title, author, contactNumber, abstract, articleType, journal, country } = req.body;
    const userId = req.user.id;
    const email = req.user.email;
    if (!userId) {
        return res.status(400).json({ message: 'User not authenticated.' });
    }

    try {
        const researchPaper = await ResearchPaper.create({
            title,
            author,
            contactNumber,
            email,
            abstract,
            articleType,
            journal,
            country,
            userId,
            filePath: req.file.path
        });

        console.log('Research paper submitted:', researchPaper);
        return res.status(201).json({ message: 'Research paper submitted successfully!', researchPaper });
    } catch (error) {
        console.error('Research paper submission error:', error);
        res.status(500).json({ message: 'Failed to submit the research paper.' });
    }
};

// Fetch research papers for a specific user
const getUserResearchPapers = async (req, res) => {
    try {
        const userId = req.user.id;
        const papers = await ResearchPaper.find({ userId });

        console.log('Fetched papers:', papers); // Log for debugging
        res.json(papers);
    } catch (error) {
        console.error('Error fetching research papers:', error);
        res.status(500).json({ error: 'Failed to fetch research papers' });
    }
};



module.exports = { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin, handleUserStatus, handleUserLogout, handleAdminStatus, handleUserForgotPassword, handleUserResetPassword, handleResearchPaperSubmission, getUserResearchPapers }; 
