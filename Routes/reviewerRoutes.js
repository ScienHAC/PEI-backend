const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const InviteToken = require('../Models/InviteToken');
const Reviewer = require('../Models/reviewer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ReviewerPaperAssignment = require('../Models/reviewerPaperAssignment');
const ResearchPaper = require('../Models/ResearchPaper');
const mongoose = require('mongoose');

// Nodemailer setup for sending email
const transporter = nodemailer.createTransport({
    host: process.env.smtpHost,
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to generate token, save it, and send invite email
const sendInviteEmail = async (email, paperId) => {
    // Generate a unique token
    const token = crypto.randomBytes(20).toString('hex');

    // Set expiration date for token (e.g., 7 days from now)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Create and save invite token in database
    await InviteToken.create({ token, email, paperId, expiresAt });

    const researchPaper = await ResearchPaper.findById(paperId);

    if (!researchPaper) {
        throw new Error('Research paper not found.');
    }

    const filePath = `${process.env.BackendUrl}/api/uploads/${researchPaper.filePath}`;
    const inviteLink = `${process.env.Client_URL}/reviewer/invite/${token}`;
    const fileName = researchPaper.title + '.pdf';

    // Email content with attachment
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Invitation to Join as a Reviewer',
        html: `
                <h2>You have been invited to join as a reviewer</h2>
                <p>Please click the link below to view the attached paper:</p>
                <a href="${filePath}" target="_blank">View Paper</a>
                <p>Please click the link below to accept the invitation and set up your account:</p>
                <a href="${inviteLink}" target="_blank">${inviteLink}</a>
                <p>This link will expire in 7 days.</p>
            `,
        attachments: [
            {
                filename: fileName,
                path: filePath,
                contentType: 'application/pdf'
            }
        ]
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

// Invite route
router.post('/send-invite', async (req, res) => {
    const { email, paperId } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        // Check if reviewer already exists
        let reviewer = await Reviewer.findOne({ email });
        if (!reviewer) {
            // Create a new reviewer entry if one doesn't exist
            reviewer = await Reviewer.create({
                email,
                password: '', // password will be set when the invite is accepted
                contact: 'Not assigned',
                name: email.split('@')[0]
            });
        }

        // Send invite email to the provided email address
        await sendInviteEmail(email, paperId);
        res.status(200).json({ message: 'Invite sent successfully.' });
    } catch (error) {
        console.error('Error sending invite:', error);
        res.status(500).json({ message: 'Failed to send invite. Please try again later.' });
    }
});

router.get('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the provided ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Invalid paper ID.' });
        }

        const researchPaper = await ResearchPaper.findById(id);

        if (!researchPaper) {
            return res.status(404).json({ message: 'Research paper not found.' });
        }

        res.status(200).json({ message: 'Research paper exists.' });
    } catch (error) {
        console.error('Error checking paper ID:', error);
        res.status(500).json({ message: 'An error occurred while checking the paper ID.' });
    }
});


// Backend route to verify the invite token
router.get('/invite/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Find the invite token in the database and check if it's still valid
        const invite = await InviteToken.findOne({ token, expiresAt: { $gt: new Date() } });

        if (!invite) {
            return res.status(400).json({ message: 'Invalid or expired invite link.' });
        }

        const reviewer = await Reviewer.findOne({ email: invite.email });

        if (reviewer.password) {
            return res.status(200).json({ message: 'Reviewer already exists. Please log in instead.', email: invite.email, isReviewer: true });
        }

        // Return the email associated with the invite for confirmation
        res.status(200).json({ email: invite.email });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while validating the invite link.' });
    }
});

// Backend route to set the password for the reviewer
router.post('/set-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Find the invite token in the database
        const invite = await InviteToken.findOne({ token });
        if (!invite) {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        let reviewer = await Reviewer.findOne({ email: invite.email });

        if (reviewer.password) {
            try {
                // If reviewer exists and has a password, prompt them to log in
                await ReviewerPaperAssignment.create({
                    email: reviewer.email,
                    reviewerId: reviewer._id,
                    paperId: invite.paperId,
                    assignedDate: Date.now(),
                    status: 'assigned',
                });
                return res.status(200).json({ message: 'Reviewer already exists. Please log in instead.' });
            } catch (error) {
                res.status(500).json({ message: "The invitation link has already been used, and you’re already invited." });
            }
        } else {
            // If reviewer exists and has no password, update the password
            if (reviewer && !reviewer.password) {
                const hashedPassword = await bcrypt.hash(password, 10);

                // Use updateOne to update only the password field
                await Reviewer.updateOne(
                    { email: invite.email },
                    { $set: { password: hashedPassword } }
                );
            }

        }

        await ReviewerPaperAssignment.create({
            email: reviewer.email,
            reviewerId: reviewer._id,
            paperId: invite.paperId,
            assignedDate: Date.now(),
            status: 'assigned',
        });

        // Delete the invite token
        await InviteToken.deleteOne({ token });
        res.status(200).json({ message: 'Password set successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while setting the password.' });
    }
});

module.exports = router;
