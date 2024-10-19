// ** Admin Middleware **

function restrictToAdmin(req, res, next) {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }

    if (!user.isAdmin) {
        return res.status(403).json({ message: 'Forbidden: Admins only.' });
    }

    next();
}

module.exports = restrictToAdmin;
