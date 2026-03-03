const rateLimit = require('express-rate-limit');

// Strict limiter for authentication routes (login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 requests per 15 minutes
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: 'draft-7',
    legacyHeaders: true,
    handler: (req, res) => {
        console.log(`[Rate Limit] Auth breach from IP: ${req.ip}`);
        res.status(429).json({ error: "Too many login attempts. Please wait 15 minutes before trying again." });
    }
});

// General limiter for other API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // 500 requests per 15 minutes
    message: { error: "Too many requests, please try again later" },
    standardHeaders: 'draft-7',
    legacyHeaders: true,
    handler: (req, res) => {
        console.log(`[Rate Limit] API breach from IP: ${req.ip}`);
        res.status(429).json({ error: "Rate limit exceeded. Please slow down." });
    }
});

module.exports = { authLimiter, apiLimiter };
