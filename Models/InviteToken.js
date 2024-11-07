const mongoose = require('mongoose');

const inviteTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 7 * 24 * 60 * 60 * 1000, // expires in 7 days
        required: true
    },
});

const InviteToken = mongoose.model('InviteToken', inviteTokenSchema);
module.exports = InviteToken;
