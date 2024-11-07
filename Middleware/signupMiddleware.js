const OTP = require('../Models/otp');
const bcrypt = require('bcrypt');
const Reviewer = require('../Models/reviewer');

// Middleware to handle signup and store user data temporarily in req.tempUser
const signupMiddleware = async (req, res, next) => {
    try {
        const { name, email, password, contact } = req.body;
        // Validate input
        if (!name || !email || !password || !contact) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const reviewer = await Reviewer.findOne({ email });
        if (reviewer) {
            return res.status(400).json({ message: 'This email is already associated with a reviewer account.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Attach the user data to req.tempUser
        req.tempUser = { name, email, password: hashedPassword, contact };
        next();
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = signupMiddleware;
