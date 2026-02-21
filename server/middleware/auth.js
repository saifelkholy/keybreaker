const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ctf_key_123';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

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
