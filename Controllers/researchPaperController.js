// controllers/researchPaperController.js

const ResearchPaper = require('../Models/ResearchPaper');
const nodemailer = require('nodemailer');

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.EMAIL_PASSWORD // Your email password
    }
});

// Function to update research paper status
exports.updatePaperStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expect status to be 'reviewed' or 'rejected'

    try {
        const updatedPaper = await ResearchPaper.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedPaper) {
            return res.status(404).json({ error: 'Research paper not found' });
        }

        // Send notification email
        const mailOptions = {
            from: process.env.EMAIL,
            to: updatedPaper.email,
            subject: `Research Paper ${status}`,
            text: `Dear ${updatedPaper.author},\n\nYour research paper titled "${updatedPaper.title}" has been marked as ${status}.\n\nThank you!`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(200).json(updatedPaper);
    } catch (error) {
        console.error('Error updating paper status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Function to get papers grouped by month/year
exports.getPapersByDate = async (req, res) => {
    const { limit = 5, skip = 0, status = 'all' } = req.query;

    try {
        // Construct the filter based on the status query
        const filter = status === 'all' ? {} : { status };

        // Get the total count of filtered documents
        const totalPapers = await ResearchPaper.countDocuments(filter);

        // Fetch paginated and sorted papers based on filter
        const papers = await ResearchPaper.find(filter)
            .sort({ createdAt: -1 }) // Sort by latest date first
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        res.status(200).json({ papers, total: totalPapers });
    } catch (error) {
        console.error('Error fetching papers by date:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

