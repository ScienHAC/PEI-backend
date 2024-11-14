const mongoose = require('mongoose');

const reviewerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: function () {
            return this.email.split('@')[0];
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false,
    },
    contact: {
        type: String,
        required: true,
        default: 'Not assigned'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'reviewer'
    },
}, { timestamps: true });

const Reviewer = mongoose.model('Reviewer', reviewerSchema);
module.exports = Reviewer;
