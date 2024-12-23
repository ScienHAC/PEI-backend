const mongoose = require('mongoose');
const userScehma = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    contact: {
        type: Number,
        required: true,
    },
    affiliation: {
        type: String,
        required: true,
        default: 'Not assigned'
    },
    areaOfSpecialization: {
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
        enum: ['user', 'reviewer', 'admin'],
        default: 'user',
    },
}, { timestamps: true });

const User = mongoose.model('Client', userScehma);
module.exports = User;