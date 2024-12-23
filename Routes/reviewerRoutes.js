const express = require('express');
const bcrypt = require('bcrypt');
const InviteToken = require('../Models/InviteToken');
const Reviewer = require('../Models/reviewer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ReviewerPaperAssignment = require('../Models/reviewerPaperAssignment');
const ResearchPaper = require('../Models/ResearchPaper');
const mongoose = require('mongoose');
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const { getAssignedPapers, getComments, addComment } = require('../Controllers/reviewerController');
const { addCommentToReviewer, getAllComments } = require('../Controllers/adminReviewerController');
const restrictToAdmin = require('../Middleware/adminMiddleware');

const router = express.Router();

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

const sendInviteEmail = async (email, paperId) => {
    // Generate a unique token
    const token = crypto.randomBytes(20).toString('hex');

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await InviteToken.create({ token, email, paperId, expiresAt });

    const researchPaper = await ResearchPaper.findById(paperId);

    if (!researchPaper) {
        throw new Error('Research paper not found.');
    }

    const filePath = `${process.env.BackendUrl}/api/uploads/${researchPaper.filePath}`;
    const inviteLink = `${process.env.Client_URL}/reviewer/invite/${token}`;
    const fileName = researchPaper.title + '.pdf';

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

    await transporter.sendMail(mailOptions);
};

// Invite route
router.post('/send-invite', restrictToLoggedInUserOnly, restrictToAdmin, async (req, res) => {
    const { email, paperId } = req.body;

    if (!email || !paperId) {
        return res.status(400).json({ message: 'Email and paperId are required.' });
    }

    try {

        const existingAssignment = await ReviewerPaperAssignment.findOne({ email, paperId });

        if (existingAssignment) {
            return res.status(200).json({ message: 'Reviewer already invited for this paper.' });
        }

        let reviewer = await Reviewer.findOne({ email });
        if (!reviewer) {
            reviewer = await Reviewer.create({
                email,
                password: '',
                contact: 'Not assigned',
                name: email.split('@')[0]
            });
        }

        res.status(200).json({ message: 'Invite sent successfully.' });

        // Send invite email to the provided email address
        await sendInviteEmail(email, paperId);
    } catch (error) {
        console.error('Error sending invite:', error);
        res.status(500).json({ message: 'Failed to send invite. Please try again later.' });
    }
});

router.post('/check-status', restrictToLoggedInUserOnly, restrictToAdmin, async (req, res) => {
    const { paperId } = req.body;

    try {
        const existingAssignments = await ReviewerPaperAssignment.find({ paperId });
        const acceptedEmails = new Set(existingAssignments.map((assignment) => assignment.email));
        const rejectedEmails = new Set(existingAssignments.filter(assignment => assignment.status === 'rejected').map((assignment) => assignment.email));
        rejectedEmails.forEach(email => acceptedEmails.delete(email));

        const pendingInvites = await InviteToken.find({ paperId });
        const pendingEmails = new Set(pendingInvites.map((invite) => invite.email));

        const combinedEmails = new Set([...acceptedEmails, ...pendingEmails, ...rejectedEmails]);

        const notInvitedReviewers = await Reviewer.find({ email: { $nin: Array.from(combinedEmails) } });
        const notInvitedEmails = notInvitedReviewers.map((reviewer) => reviewer.email);

        const reviewersStatus = [];

        for (const email of acceptedEmails) {
            reviewersStatus.push({
                email,
                status: 'accepted',
            });
        }

        for (const email of rejectedEmails) {
            reviewersStatus.push({
                email,
                status: 'rejected',
            });
        }

        for (const email of pendingEmails) {
            if (!acceptedEmails.has(email)) {
                reviewersStatus.push({
                    email,
                    status: 'not accepted',
                });
            }
        }

        for (const email of notInvitedEmails) {
            reviewersStatus.push({
                email,
                status: 'not invited',
            });
        }

        res.status(200).json({ reviewersStatus });
    } catch (error) {
        console.error("Error checking reviewers status:", error);
        res.status(500).json({ message: "An error occurred while checking reviewer status." });
    }
});


router.get('/profile-data', restrictToLoggedInUserOnly, restrictToAdmin, async (req, res) => {
    const email = req.query.email;

    try {
        const reviewer = await Reviewer.findOne({ email });
        const totalRejectedPaper = await ReviewerPaperAssignment.find({ email, status: 'rejected' }).countDocuments();
        const totalPaperAccepted = await ReviewerPaperAssignment.find({ email }).countDocuments() - totalRejectedPaper;

        const totalPaperAssignedInvite = await InviteToken.aggregate([
            { $match: { email: email } },
            { $group: { _id: "$paperId" } },
            { $count: "uniquePaperIdCount" }
        ]);
        const uniquePaperIdCount = totalPaperAssignedInvite.length > 0 ? totalPaperAssignedInvite[0].uniquePaperIdCount : 0;

        const totalPaperAssigned = uniquePaperIdCount + totalPaperAccepted + totalRejectedPaper;

        const totalPaperNotAccepted = uniquePaperIdCount;

        const totalPendingPaperFeedback = await ReviewerPaperAssignment.find({
            email: email,
            comments: { $size: 0 }
        }).countDocuments() - totalRejectedPaper;

        const totalPaperFeedback = await ReviewerPaperAssignment.find({
            email: email,
            comments: { $not: { $size: 0 } }
        }).countDocuments();

        res.json({
            totalPaperAssigned: totalPaperAssigned,
            totalPaperAccepted: totalPaperAccepted,
            totalPaperNotAccepted: totalPaperNotAccepted,
            totalPendingPaperFeedback: totalPendingPaperFeedback,
            totalPaperFeedback: totalPaperFeedback,
            totalRejectedPaper: totalRejectedPaper,
            reviewerName: reviewer.name,
            reviewerAffiliation: reviewer.affiliation,
            reviewerAreaOfSpecialization: reviewer.areaOfSpecialization
        });

    } catch (error) {
        console.error("Error checking reviewers status:", error);
        res.status(500).json({ message: "An error occurred while checking reviewer profile data." });
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

        res.status(200).json({ message: 'Research paper exists.', researchPaper });
    } catch (error) {
        console.error('Error checking paper ID:', error);
        res.status(500).json({ message: 'An error occurred while checking the paper ID.' });
    }
});


// Backend route to verify the invite token
router.get('/invite/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const invite = await InviteToken.findOne({ token, expiresAt: { $gt: new Date() } });

        if (!invite) {
            return res.status(400).json({ message: 'Invalid or expired invite link.' });
        }

        const reviewer = await Reviewer.findOne({ email: invite.email });

        const researchPaper = await ResearchPaper.findById(invite.paperId);

        if (!researchPaper) {
            return res.status(404).json({ message: 'Research paper not found.' });
        }

        const filePath = `${process.env.BackendUrl}/api/uploads/${researchPaper.filePath}`;
        const fileName = researchPaper.title;

        if (reviewer.password) {
            return res.status(200).json({ message: 'Reviewer already exists. Please log in instead.', email: invite.email, isReviewer: true, fileName, filePath });
        }

        res.status(200).json({ email: invite.email, fileName, filePath });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while validating the invite link.' });
    }
});

// Backend route to set the password for the reviewer
router.post('/set-password-and-details/:token', async (req, res) => {
    const { token } = req.params;
    const { password, affiliation, areaOfSpecialization } = req.body;

    try {
        const invite = await InviteToken.findOne({ token });
        if (!invite) {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        const existingAssignment = await ReviewerPaperAssignment.findOne({
            email: invite.email,
            paperId: invite.paperId,
        });

        if (existingAssignment) {
            return res.status(400).json({ message: "The invitation link has already been used, and you’re already invited." });
        }

        let reviewer = await Reviewer.findOne({ email: invite.email });

        if (reviewer.password) {
            try {
                await ReviewerPaperAssignment.create({
                    email: reviewer.email,
                    reviewerId: reviewer._id,
                    paperId: invite.paperId,
                    assignedDate: Date.now(),
                    status: 'assigned',
                });
                return res.status(200).json({ message: 'Reviewer already exists. Please log in instead.' });
            } catch (error) {
                if (!res.headersSent) {
                    return res.status(400).json({ message: "The invitation link has already been used, and you’re already invited." });
                } else {
                    console.error('Error occurred, response already sent:', error);
                }
            }
        } else {
            if (reviewer && !reviewer.password) {
                const hashedPassword = await bcrypt.hash(password, 10);

                await Reviewer.updateOne(
                    { email: invite.email },
                    {
                        $set: {
                            password: hashedPassword,
                            affiliation,
                            areaOfSpecialization
                        }
                    }
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

router.post('/reject-invite/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const invite = await InviteToken.findOne({ token });
        if (!invite) {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        const existingAssignment = await ReviewerPaperAssignment.findOne({
            email: invite.email,
            paperId: invite.paperId,
        });

        if (existingAssignment) {
            return res.status(400).json({ message: "The invitation link has already been used, and you’re already invited." });
        }

        let reviewer = await Reviewer.findOne({ email: invite.email });

        if (reviewer) {
            await ReviewerPaperAssignment.create({
                email: reviewer.email,
                reviewerId: reviewer._id,
                paperId: invite.paperId,
                assignedDate: Date.now(),
                status: 'rejected',
            });
        }

        await InviteToken.deleteOne({ token });
        res.status(200).json({ message: 'Invite rejected.' });

    } catch (error) {
        res.status(500).json({ message: 'An error occurred while rejecting the invite.' });
    }
});


router.get('/exist/all', restrictToLoggedInUserOnly, restrictToAdmin, async (req, res) => {
    try {
        const reviewers = await Reviewer.find({});
        res.status(200).json(reviewers);
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while fetching reviewers.' });
    }
});
router.get('/papers', restrictToLoggedInUserOnly, getAssignedPapers);
router.get('/comments', restrictToLoggedInUserOnly, getComments);
router.post('/comments', restrictToLoggedInUserOnly, addComment);
router.get('/comments/admin/all', restrictToLoggedInUserOnly, restrictToAdmin, getAllComments);
router.post('/comments/admin/add', restrictToLoggedInUserOnly, restrictToAdmin, addCommentToReviewer);

module.exports = router;
