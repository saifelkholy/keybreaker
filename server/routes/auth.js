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
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    if (username.length > 20) return res.status(400).json({ error: 'Username must be 20 characters or less' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await getDb();

    try {
        const result = await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        const user = { id: result.lastID, username, points: 0, rank: 'Beginner' };
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user });
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

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user });
});

router.get('/me', authenticateToken, async (req, res) => {
    const db = await getDb();
    const user = await db.get('SELECT id, username, points, rank, bio, photo, gender, contact_type, contact_value FROM users WHERE id = ?', [req.user.id]);

    // Get solved count
    const solved = await db.get('SELECT COUNT(*) as count FROM solves WHERE user_id = ?', [req.user.id]);
    user.solvedCount = solved.count;

    res.json(user);
});

router.put('/profile', authenticateToken, async (req, res) => {
    const { bio, photo, gender, contact_type, contact_value } = req.body;
    const db = await getDb();

    // Strict Input Validation
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

    // Return only public info
    const publicProfile = {
        username: user.username,
        points: user.points,
        rank: user.rank,
        bio: user.bio,
        photo: user.photo,
        gender: user.gender,
        contact_type: user.contact_type,
        contact_value: user.contact_value, // Assuming contact info is public if set
        solvedCount: user.solvedCount
    };

    res.json(publicProfile);
});

module.exports = router;
