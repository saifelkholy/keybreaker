const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { getChallenges, getNextRotation } = require('../utils/cryptoGen');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    const db = await getDb();
    const rawChallenges = getChallenges();
    const nextRotation = getNextRotation(); // Get rotation time

    const solved = await db.all('SELECT challenge_id FROM solves WHERE user_id = ?', [req.user.id]);
    const solvedIds = new Set(solved.map(s => s.challenge_id));

    const challenges = rawChallenges.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        points: c.points,
        ciphertext: c.ciphertext,
        type: c.type,
        category: c.category, // Send category
        hint: c.hint,
        flagPattern: c.flagPattern,
        solved: solvedIds.has(c.id)
    }));

    res.json({ challenges, nextRotation }); // Wrapper object with metadata
});

router.post('/submit', authenticateToken, async (req, res) => {
    const { challengeId, flag } = req.body;

    const currentChallenges = getChallenges();
    const challenge = currentChallenges.find(c => c.id === challengeId);

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (flag.trim() !== challenge.flag) {
        return res.status(400).json({ error: 'Incorrect flag' });
    }

    const db = await getDb();
    const existing = await db.get(
        'SELECT * FROM solves WHERE user_id = ? AND challenge_id = ?',
        [req.user.id, challengeId]
    );

    if (existing) {
        return res.status(400).json({ error: 'Already solved' });
    }

    try {
        await db.run('BEGIN TRANSACTION');
        await db.run('INSERT INTO solves (user_id, challenge_id) VALUES (?, ?)', [req.user.id, challengeId]);
        await db.run('UPDATE users SET points = points + ? WHERE id = ?', [challenge.points, req.user.id]);

        const user = await db.get('SELECT points FROM users WHERE id = ?', [req.user.id]);
        let newRank = 'Beginner';
        if (user.points >= 2000) newRank = 'Hash Breaker';
        else if (user.points >= 500) newRank = 'Pro';
        else if (user.points >= 200) newRank = 'Medium';

        await db.run('UPDATE users SET rank = ? WHERE id = ?', [newRank, req.user.id]);
        await db.run('COMMIT');

        res.json({ success: true, pointsAdded: challenge.points, newRank });
    } catch (err) {
        await db.run('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
