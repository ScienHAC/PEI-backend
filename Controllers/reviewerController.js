const ReviewerPaperAssignment = require("../Models/reviewerPaperAssignment");

// Function to get papers assigned to the reviewer
exports.getAssignedPapers = async (req, res) => {
    try {
        const { email } = req.user;
        const { status } = req.query;

        const query = { email };
        if (status && status !== "all") {
            query.status = status;
        }

        const papers = await ReviewerPaperAssignment.find(query).populate("paperId", "title author abstract journal articleType thumbnail createdAt updatedAt").exec();
        const total = await ReviewerPaperAssignment.countDocuments({ email }).exec();
        const totalAssigned = await ReviewerPaperAssignment.countDocuments({ email, status: "assigned" }).exec();
        const totalCompleted = await ReviewerPaperAssignment.countDocuments({ email, status: "completed" }).exec();
        const transformedPapers = papers.map((paper) => {
            return {
                ...paper.toObject(),
                paperData: paper.paperId,
                paperId: undefined,
            };
        });

        res.json({ total, totalAssigned, totalCompleted, papers: transformedPapers });
    } catch (error) {
        console.error("Failed to fetch papers:", error);
        res.status(500).json({ message: "Failed to fetch papers" });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { paperId } = req.query;

        // Check if the paper assignment exists
        const paperAssignment = await ReviewerPaperAssignment.findOne({ _id: paperId })
        if (!paperAssignment)
            return res.status(400).json({ message: "No feedback given" });

        res.status(200).json({ comments: paperAssignment.comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Failed to fetch comments" });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { paperId, commentText } = req.body;
        const { id, role } = req.user;
        const paperAssignment = await ReviewerPaperAssignment.findOne({ _id: paperId });
        if (!paperAssignment)
            return res.status(404).json({ message: "Paper not found" });

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

