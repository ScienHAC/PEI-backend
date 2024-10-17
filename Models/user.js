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
}, { timestamps: true });

const User = mongoose.model('Client', userScehma);
module.exports = User;