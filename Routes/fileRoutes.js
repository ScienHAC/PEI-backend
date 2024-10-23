const express = require('express');
const path = require('path');
const router = express.Router();
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const { getUserResearchPapers, handleUpdateUser } = require('../Controllers/user');

// Route to fetch research papers uploaded by the logged-in user
router.get('/research', restrictToLoggedInUserOnly, getUserResearchPapers);
//Update user name
router.post('/user/update', restrictToLoggedInUserOnly, handleUpdateUser);
// Route to serve uploaded files
router.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'File not found' });
        }
    });
});

module.exports = router;
