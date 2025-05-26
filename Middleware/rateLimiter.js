const rateLimit = require('express-rate-limit');

// Contact form rate limiter
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Only 3 submissions per 15 minutes per IP
    message: {
        message: 'Too many contact form submissions. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per IP
    message: {
        message: 'Too many requests. Please try again later.'
    }
});

module.exports = { contactLimiter, generalLimiter };