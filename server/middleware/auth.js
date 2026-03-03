const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        // Security: Check if user is banned
        // This is critical for the Dual Ban System (IP + Account)
        try {
            const { getDb } = require('../database');
            const db = await getDb();
            const dbUser = await db.get('SELECT is_banned FROM users WHERE id = ?', [user.id]);

            if (dbUser && dbUser.is_banned) {
                console.log(`[AUTH] Blocked banned user: ${user.username} (${user.id})`);
                return res.status(403).json({ error: "Your account has been suspended due to suspicious activity." });
            }

            req.user = user;
            next();
        } catch (e) {
            console.error("Auth middleware error:", e);
            res.sendStatus(500);
        }
    });
}

module.exports = { authenticateToken, JWT_SECRET };
