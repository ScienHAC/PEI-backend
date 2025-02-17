const mongoose = require('mongoose');

const researchPaperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    abstract: { type: String, required: true },
    articleType: { type: String, required: true },
    journal: { type: String, required: true },
    country: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client' },
    filePath: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    status: { type: String, default: 'under review', enum: ['under review', 'reviewed', 'rejected'] },
}, { timestamps: true });

const ResearchPaper = mongoose.model('ResearchPaper', researchPaperSchema);

module.exports = ResearchPaper;
