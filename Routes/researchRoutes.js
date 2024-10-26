const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { updateResearchPaper } = require('../Controllers/user');
const { updatePaperStatus, getPapersByDate, getPapersById } = require('../Controllers/researchPaperController');
const { restrictToLoggedInUserOnly } = require('../Middleware/auth');
const restrictToAdmin = require('../Middleware/adminMiddleware');

// Set the directory path for thumbnails
const thumbnailDir = path.join(__dirname, '..', 'uploads', 'thumbnails');

// Check if the directory exists, if not, create it
if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
}

// Configure multer storage for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, thumbnailDir); // Use the directory path
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve thumbnail images
router.get('/uploads/thumbnails/:filename', (req, res) => {
    const filePath = path.join(__dirname, '..', 'uploads', 'thumbnails', req.params.filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'File not found' });
        }
    });
});

// Endpoint to handle thumbnail uploads
router.put('/publish/research/:id', upload.single('thumbnail'), updateResearchPaper);

// Update research paper status (reviewed or rejected)
router.put('/research/status/:id', restrictToLoggedInUserOnly, restrictToAdmin, updatePaperStatus);

// Get research papers by date with pagination and status filter
router.get('/research/by-date', restrictToLoggedInUserOnly, restrictToAdmin, getPapersByDate);

// GET /api/papers/:paperId
router.put('/papers/:paperId', restrictToLoggedInUserOnly, getPapersById);

module.exports = router;
