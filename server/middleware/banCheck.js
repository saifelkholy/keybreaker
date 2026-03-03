const { getDb } = require('../database');

const checkBan = async (req, res, next) => {
    try {
        const db = await getDb();

        // 1. Check IP Ban
        const ipBan = await db.get('SELECT * FROM banned_ips WHERE ip = ?', [req.ip]);
        if (ipBan) {
            console.log(`[BAN CHECK] Blocked banned IP: ${req.ip}`);
            return res.status(403).json({ error: "Your IP is permanently banned due to suspicious activity." });
        }

        // 2. Check User Ban (If authenticated)
        // Note: This relies on auth middleware running BEFORE this if we want to catch it here.
        // However, usually we want this to run FIRST to save resources.
        // If we want to ban users, we might need to verify the token here OR rely on the routes that use auth.
        // For strict DOS protection, IP check is most important here.
        // We will add a secondary check if req.user is populated (e.g. by a previous auth middleware, though typically this runs first).

        if (req.user && req.user.id) {
            const user = await db.get('SELECT is_banned FROM users WHERE id = ?', [req.user.id]);
            if (user && user.is_banned) {
                console.log(`[BAN CHECK] Blocked banned User: ${req.user.username} (${req.user.id})`);
                return res.status(403).json({ error: "Your account has been suspended due to suspicious activity." });
            }
        }

        next();
    } catch (error) {
        console.error("Ban check error:", error);
        // Fail open or closed? Closed for security.
        res.status(500).json({ error: "Internal Server Error during security check" });
    }
};

module.exports = checkBan;
