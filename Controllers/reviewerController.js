const ReviewerPaperAssignment = require('../Models/reviewerPaperAssignment');

// Function to get papers assigned to the reviewer
exports.getAssignedPapers = async (req, res) => {
    try {
        const { email } = req.user;
        const { status } = req.query;

        const query = { email };
        if (status && status !== 'all') {
            query.status = status;
        }

        const papers = await ReviewerPaperAssignment.find(query).populate('paperId', 'title');
        res.json({ papers });
    } catch (error) {
        console.error('Failed to fetch papers:', error);
        res.status(500).json({ message: 'Failed to fetch papers' });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { paperId } = req.query;

        // Check if the paper assignment exists
        const paperAssignment = await ReviewerPaperAssignment.findOne({ paperId }).populate('comments.userId', 'email role');
        if (!paperAssignment) return res.status(404).json({ message: 'Paper not found' });

        res.status(200).json({ comments: paperAssignment.comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { paperId, commentText } = req.body;
        const { userId, role } = req.user;
        const paperAssignment = await ReviewerPaperAssignment.findOne({ paperId });
        if (!paperAssignment) return res.status(404).json({ message: 'Paper not found' });

        // Add new comment
        const newComment = {
            userId,
            role,
            commentText,
            createdAt: new Date()
        };
        paperAssignment.comments.push(newComment);
        await paperAssignment.save();

        res.status(201).json({ comment: newComment });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
};
