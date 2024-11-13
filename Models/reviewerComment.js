const mongoose = require('mongoose');

const reviewerCommentSchema = new mongoose.Schema({
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reviewer',
        required: true
    },
    paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResearchPaper',
        required: true
    },
    commentText: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ReviewerComment = mongoose.model('ReviewerComment', reviewerCommentSchema);
module.exports = ReviewerComment;