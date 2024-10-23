const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;
require('dotenv').config();

// **Generate JWT Token**
function setUser(user) {
    return jwt.sign(
        { id: user._id, name: user.name, email: user.email, contact: user.contact, isAdmin: user.isAdmin },
        SECRET_KEY
    );
}

// **Get User from Token**
function getUser(token) {
    if (!token) {
        return null;
    }
    return jwt.verify(token, SECRET_KEY);
}

module.exports = { setUser, getUser };