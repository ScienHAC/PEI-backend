const isOwnerOrAdmin = (req, fileOwnerId) => {
    const userId = req.user._id.toString();
    const isAdmin = req.user.isAdmin;
    const isOwner = userId === fileOwnerId;

    return isAdmin || isOwner;
};

module.exports = { isOwnerOrAdmin };
