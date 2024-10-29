const express = require('express');
const path = require('path');
const router = express.Router();
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const { getUserResearchPapers, handleUpdateUser } = require('../Controllers/user');
const fs = require('fs');

const pdfDir = path.join(__dirname, '..', 'uploads', 'pdf');
const docDir = path.join(__dirname, '..', 'uploads/doc');

if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}

// Route to fetch research papers uploaded by the logged-in user
router.get('/research', restrictToLoggedInUserOnly, getUserResearchPapers);
//Update user name
router.post('/user/update', restrictToLoggedInUserOnly, handleUpdateUser);
// Route to serve uploaded PDF files
router.get('/uploads/pdf/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads/pdf', req.params.filename);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'File not found' });
        }
    });
});


module.exports = router;
