const { getUser } = require('../Services/auth');

// **Authentication Middleware**
function restrictToLoggedInUserOnly(req, res, next) {
    const token = req.cookies._auth_token_pei;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const user = getUser(token); // Get user data from token
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
        req.user = user; // Add user data to the request
        next(); // Move to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

module.exports = { restrictToLoggedInUserOnly };