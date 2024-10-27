const ResearchPaper = require('../Models/ResearchPaper');
const nodemailer = require('nodemailer');

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.smtpHost,
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to update research paper status
exports.updatePaperStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

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
        const filter = status === 'all' ? {} : { status };

        const totalPapers = await ResearchPaper.countDocuments(filter);

        // Fetch paginated and sorted papers based on filter
        const papers = await ResearchPaper.find(filter)
            .sort({ createdAt: -1 }) // Sort by latest date first
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        // Additional counts for each status
        const allPapers = await ResearchPaper.countDocuments('all');
        const totalReviewed = await ResearchPaper.countDocuments({ status: 'reviewed' });
        const totalRejected = await ResearchPaper.countDocuments({ status: 'rejected' });
        const totalUnderReview = await ResearchPaper.countDocuments({ status: 'under review' });

        res.status(200).json({
            papers,
            total: totalPapers,
            reviewCounts: {
                total: allPapers,
                reviewed: totalReviewed,
                rejected: totalRejected,
                underReview: totalUnderReview
            }
        });
    } catch (error) {
        console.error('Error fetching papers by date:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Function to get user research paper details by ID
exports.getPapersById = async (req, res) => {
    const paperId = req.params.paperId;
    try {
        let paper;
        // Check if the user is an admin
        if (req.user.isAdmin) {
            // Admin can see all papers
            paper = await ResearchPaper.findById(paperId);
        } else {
            // Regular user can only see their own papers
            paper = await ResearchPaper.findOne({ _id: paperId, email: req.user.email });
        }

        if (!paper) {
            return res.status(404).json({ message: 'Paper not found' });
        }

        res.json(paper);
    } catch (error) {
        console.error('Error fetching paper:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Fetch distinct years with submitted documents
exports.getArchivesByYear = async (req, res) => {
    try {
        const years = await ResearchPaper.aggregate([
            { $group: { _id: { $year: "$createdAt" } } },
            { $sort: { "_id": -1 } }
        ]).exec();
        res.json({ years: years.map(y => y._id) });
    } catch (error) {
        console.error("Error fetching years:", error);
        res.status(500).send("Server error");
    }
};


// Fetch volumes for a given year with up to 20 documents per volume
exports.getPapersByVolume = async (req, res) => {
    const PAPERS_PER_VOLUME = 20;

    try {
        const yearsData = await ResearchPaper.aggregate([
            { $group: { _id: { $year: "$createdAt" } } },
            { $sort: { "_id": 1 } }
        ]);

        let cumulativeVolume = 1;
        const volumeData = {};

        for (const yearObj of yearsData) {
            const year = yearObj._id;

            const volumes = await ResearchPaper.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(`${year}-01-01`),
                            $lt: new Date(`${year + 1}-01-01`)
                        },
                        status: 'reviewed'
                    }
                },
                {
                    $group: {
                        _id: {
                            $switch: {
                                branches: [
                                    { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: "Jan-Mar" },
                                    { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: "Apr-Jun" },
                                    { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: "Jul-Sep" },
                                ],
                                default: "Oct-Dec"
                            }
                        },
                        papers: { $push: "$$ROOT" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const yearVolumeData = [];
            volumes.forEach((vol) => {
                const paperGroups = [];
                for (let i = 0; i < vol.papers.length; i += PAPERS_PER_VOLUME) {
                    paperGroups.push({
                        volume: `Volume ${cumulativeVolume}`,
                        papers: vol.papers.slice(i, i + PAPERS_PER_VOLUME)
                    });
                    cumulativeVolume++;
                }
                yearVolumeData.push({ quarter: `${vol._id} ${year}`, volumes: paperGroups });
            });

            volumeData[year] = yearVolumeData;
        }

        const requestedYear = parseInt(req.params.year);
        res.json({ volumes: volumeData[requestedYear] || [] });

    } catch (error) {
        console.error("Error fetching volumes:", error);
        res.status(500).send("Server error");
    }
};

