const mongoose = require('mongoose');

const reviewerPaperAssignmentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'reviewers',
        required: true
    },
    paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResearchPaper',
        required: true,
        unique: true
    },
    assignedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['assigned', 'reviewing', 'completed'],
        default: 'assigned'
    },
    comments: {
        type: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                role: {
                    type: String,
                    enum: ['reviewer', 'admin'],
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
            }
        ],
        default: []
    }
}, { timestamps: true });

reviewerPaperAssignmentSchema.index({ paperId: 1 }, { unique: true });
const ReviewerPaperAssignment = mongoose.model('ReviewerPaperAssignment', reviewerPaperAssignmentSchema);
module.exports = ReviewerPaperAssignment;
