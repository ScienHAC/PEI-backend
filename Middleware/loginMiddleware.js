const OTP = require('../Models/otp');
const bcrypt = require('bcrypt');

// Middleware to handle login and store user data temporarily in req.tempUser
const loginMiddleware = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Attach the user data to req.tempUser
        req.Client_User = { email, password };
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = loginMiddleware;
