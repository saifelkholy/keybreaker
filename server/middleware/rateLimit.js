const rateLimit = require('express-rate-limit');

// Strict limiter for authentication routes (login/register)
const authLimiter = rateLimit({
    windowMs: 1000, // 1 second
    limit: 100, // 100 requests per second
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: 'draft-7',
    legacyHeaders: true,
    handler: async (req, res, next, options) => {
        console.log(`[Rate Limit] BLOCKED Auth request from IP: ${req.ip}`);
        try {
            const { getDb } = require('../database');
            const db = await getDb();

            // Ban IP
            await db.run('INSERT OR IGNORE INTO banned_ips (ip, reason) VALUES (?, ?)', [req.ip, 'Rate Limit Exceeded (Auth)']);

            // Ban User if authenticated (Unlikely in auth route but good practice)
            if (req.user && req.user.id) {
                await db.run('UPDATE users SET is_banned = 1 WHERE id = ?', [req.user.id]);
            }
        } catch (e) {
            console.error("Error banning user:", e);
        }
        res.status(403).json({ error: "Too many login attempts. You have been banned." });
    }
});

// General limiter for other API routes
const apiLimiter = rateLimit({
    windowMs: 1000, // 1 second
    limit: 100, // 100 requests per second
    message: { error: "Too many requests, please try again later" },
    standardHeaders: 'draft-7',
    legacyHeaders: true,
    handler: async (req, res, next, options) => {
        console.log(`[Rate Limit] BLOCKED API request from IP: ${req.ip}`);
        try {
            const { getDb } = require('../database');
            const db = await getDb();

            // Ban IP
            await db.run('INSERT OR IGNORE INTO banned_ips (ip, reason) VALUES (?, ?)', [req.ip, 'Rate Limit Exceeded (API)']);

            // Ban User if authenticated
            if (req.user && req.user.id) {
                await db.run('UPDATE users SET is_banned = 1 WHERE id = ?', [req.user.id]);
                console.log(`[Rate Limit] Banned User ID: ${req.user.id}`);
            }
        } catch (e) {
            console.error("Error banning user:", e);
        }
        res.status(403).json({ error: "Too many requests. You have been banned." });
    }
});

module.exports = { authLimiter, apiLimiter };
