const User = require('../Models/user');
const { setUser } = require('../Services/auth');
const nodemailer = require('nodemailer');
const OTP = require('../Models/otp');
const bcrypt = require('bcrypt');
const Reviewer = require('../Models/reviewer');
const ResearchPaper = require('../Models/ResearchPaper');
const path = require('path');
const fs = require('fs');

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.smtpHost,
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});


let handleUserSignup = async (req, res) => {
    try {
        const { name, email, password, contact } = req.body;
        if (!name || !email || !password || !contact) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const reviewer = await Reviewer.findOne({ email });
        if (reviewer) {
            return res.status(400).json({ message: 'This email is already associated with a reviewer account.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
        let user = await User.findOne({ email });

        if (!user) {
            user = await Reviewer.findOne({ email });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
        const user = await User.findOne({ email }) || await Reviewer.findOne({ email });
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
        if (!req.file) {
            return res.status(400).json({ message: 'PDF file is required.' });
        }

        let fileName;

        if (req.file.mimetype === 'application/pdf') {
            fileName = req.file.filename;
        } else if (
            req.file.mimetype === 'application/msword' ||
            req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            fileName = req.file.filename.replace(path.extname(req.file.originalname), '.pdf');
        } else {
            return res.status(400).json({ message: 'Invalid file type. Only PDF and DOCX files are accepted.' });
        }

        // Create the research paper record in the database
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
            filePath: `pdf/${fileName}`
        });

        // Prepare the email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.AdminEmail,
            subject: `Research Paper Submitted Successfully`,
            text: `Dear Admin,\n\nResearch paper titled "${title}" published by "${email}" has been successfully submitted and marked for review. You can view the research paper in the Admin panel.\n\nThank you!`,
            attachments: [
                {
                    filename: `${fileName}`,
                    path: `${process.env.BackendUrl}/api/uploads/pdf/${fileName}`,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Send the email notification
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        console.log('Research paper submitted:', researchPaper);
        return res.status(201).json({ message: 'Research paper submitted successfully!', researchPaper });
    } catch (error) {
        console.error('Research paper submission error:', error);
        res.status(500).json({ message: 'Failed to submit the research paper.' });
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
                else console.log('Uploaded PDF deleted due to submission failure.');
            });
        }
    }
};



// Fetch research papers for a specific user
const getUserResearchPapers = async (req, res) => {
    try {
        const userId = req.user.id;
        const papers = await ResearchPaper.find({ userId });

        res.json(papers);
    } catch (error) {
        console.error('Error fetching research papers:', error);
        res.status(500).json({ error: 'Failed to fetch research papers' });
    }
};


// Update user's details
const handleUpdateUser = async (req, res) => {
    const userId = req.user.id;
    const { newName, newContact } = req.body;

    try {
        // Find and update user's name and/or contact
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                ...(newName && { name: newName }),
                ...(newContact && { contact: newContact })
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Refresh the authentication token with the updated user's info
        const token = setUser(updatedUser);

        // Set the updated cookie
        res.cookie('_auth_token_pei', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        });

        res.status(200).json({ message: 'User details updated successfully.', user: updatedUser });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Update a research paper by its ID
async function updateResearchPaper(req, res) {
    try {
        const { id } = req.params;
        const updateData = {};

        if (req.body.title) {
            updateData.title = req.body.title;
        }
        if (req.body.abstract) {
            updateData.abstract = req.body.abstract;
        }

        // Check if a thumbnail file was uploaded
        if (req.file) {
            updateData.thumbnail = req.file.filename;
        }

        const updatedPaper = await ResearchPaper.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedPaper) {
            return res.status(404).json({ message: "Research paper not found" });
        }

        res.status(200).json(updatedPaper);
    } catch (error) {
        console.error('Error updating research paper:', error);
        res.status(500).json({ message: 'Error updating research paper', error });
    }
}

async function fetchAllResearchPaper(req, res) {
    const { page = 1, limit = 5, status } = req.query;

    try {
        const filter = status ? { status } : {};

        const papers = await ResearchPaper.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((page - 1) * limit)
            .exec();

        const totalPapers = await ResearchPaper.countDocuments(filter);
        res.json({
            papers,
            totalPages: Math.ceil(totalPapers / limit),
            currentPage: Number(page),
        });
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}


//contact us
let handleContactUs = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !phone || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.AdminEmail,
            subject: `Contact Us Form Submission - ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact Us error:', error);
        res.status(500).json({ message: 'Failed to send message.' });
    }
};

module.exports = { handleUserSignup, handleUserLogin, handleUserOtpSignup, handleUserOtpLogin, handleUserStatus, handleUserLogout, handleAdminStatus, handleUserForgotPassword, handleUserResetPassword, handleResearchPaperSubmission, getUserResearchPapers, handleUpdateUser, updateResearchPaper, fetchAllResearchPaper, handleContactUs }; 
