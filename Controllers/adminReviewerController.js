const ReviewerPaperAssignment = require("../Models/reviewerPaperAssignment");

exports.getAllComments = async (req, res) => {
    try {
        const { paperId } = req.query;

        const query = { paperId };
        const paperAssignment = await ReviewerPaperAssignment.find(query);
        if (!paperAssignment) {
            return res.status(404).json({ message: "No comments found" });
        }
        res.status(200).json({ paperAssignment });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Failed to fetch comments" });
    }
};

exports.addCommentToReviewer = async (req, res) => {
    try {
        const { paperId, commentText, email } = req.body;
        const { id, role } = req.user;

        if (!paperId || !commentText || !email) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const paperAssignment = await ReviewerPaperAssignment.findOne({ paperId, email });
        if (!paperAssignment) {
            return res.status(404).json({ message: "Paper not found" });
        }

        const newComment = {
            userId: id,
            role,
            commentText,
            createdAt: new Date(),
        };

        paperAssignment.comments.push(newComment);
        await paperAssignment.save();

        res.status(201).json({ comment: newComment });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Failed to add comment" });
    }
};
