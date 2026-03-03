const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in environment variables.');
}
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    // Password Strength Policy: Min 8 chars, 1 number, 1 special char
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters long and contain at least one number and one special character'
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds to 12 for better security
    const db = await getDb();

    try {
        const result = await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        const user = { id: result.lastID, username, points: 0, rank: 'Beginner' };
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ user });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ user });
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', authenticateToken, async (req, res) => {
    const db = await getDb();
    const user = await db.get('SELECT id, username, points, rank, bio, photo, gender, contact_type, contact_value FROM users WHERE id = ?', [req.user.id]);

    // Get solved count
    const solved = await db.get('SELECT COUNT(*) as count FROM solves WHERE user_id = ?', [req.user.id]);
    user.solvedCount = solved.count;

    // Get badges
    const badges = await db.all('SELECT badge_name, granted_at FROM user_badges WHERE user_id = ?', [req.user.id]);
    user.badges = badges;

    res.json(user);
});

router.put('/profile', authenticateToken, async (req, res) => {
    const { bio, photo, gender, contact_type, contact_value } = req.body;
    const db = await getDb();

    // Strict Input Validation & Length Limits (DoS Protection)
    if (bio && bio.length > 500) {
        return res.status(400).json({ error: 'Bio too long (max 500 chars)' });
    }
    // Photo URL Validation (Prevent XSS via javascript: or data: URIs)
    if (photo) {
        try {
            const url = new URL(photo);
            if (!['http:', 'https:'].includes(url.protocol)) {
                return res.status(400).json({ error: 'Invalid photo URL protocol' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Invalid photo URL format' });
        }
    }

    if (gender && !['Male', 'Female'].includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender' });
    }
    if (contact_type && !['Email', 'Phone'].includes(contact_type)) {
        return res.status(400).json({ error: 'Invalid contact type' });
    }

    try {
        await db.run(
            `UPDATE users SET bio = ?, photo = ?, gender = ?, contact_type = ?, contact_value = ? WHERE id = ?`,
            [bio, photo, gender, contact_type, contact_value, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

router.delete('/account', authenticateToken, async (req, res) => {
    const db = await getDb();
    try {
        await db.run('BEGIN TRANSACTION');
        await db.run('DELETE FROM solves WHERE user_id = ?', [req.user.id]);
        await db.run('DELETE FROM user_badges WHERE user_id = ?', [req.user.id]);
        await db.run('DELETE FROM users WHERE id = ?', [req.user.id]);
        await db.run('COMMIT');
        res.json({ success: true, message: 'Account deleted' });
    } catch (err) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: 'Deletion failed' });
    }
});

router.get('/user/:username', authenticateToken, async (req, res) => {
    const { username } = req.params;
    const db = await getDb();

    // Complex query to get rank and solved count efficiently
    const user = await db.get(
        `SELECT id, username, points, rank, bio, photo, gender, contact_type, 
        (SELECT COUNT(*) FROM solves WHERE user_id = users.id) as solvedCount 
        FROM users WHERE username = ?`,
        [username]
    );

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Get badges
    const badges = await db.all('SELECT badge_name, granted_at FROM user_badges WHERE user_id = ?', [user.id]);

    // Return only public info
    const publicProfile = {
        username: user.username,
        points: user.points,
        rank: user.rank,
        bio: user.bio,
        photo: user.photo,
        gender: user.gender,
        contact_type: user.contact_type,
        // contact_value: user.contact_value, // SECURITY: Removed to prevent PII leak in public profiles
        solvedCount: user.solvedCount,
        badges: badges
    };

    res.json(publicProfile);
});

module.exports = router;
