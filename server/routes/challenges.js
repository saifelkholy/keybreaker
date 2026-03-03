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

        // --- Achievement Badges Logic ---
        const badgesToAward = [];

        // 1. Solve Milestones
        const solveCountRes = await db.get('SELECT COUNT(*) as count FROM solves WHERE user_id = ?', [req.user.id]);
        const totalSolved = solveCountRes.count;

        if (totalSolved === 1) badgesToAward.push('First Step');
        if (totalSolved === 10) badgesToAward.push('10 Challenges Solved');
        if (totalSolved === 25) badgesToAward.push('25 Challenges Solved');
        if (totalSolved === 50) badgesToAward.push('50 Challenges Solved');
        if (totalSolved === 100) badgesToAward.push('100 Challenges Solved');
        if (totalSolved === 250) badgesToAward.push('250 Challenges Solved');

        // 2. Category Completion
        const categoryMapper = {
            'Factorization': 'Mathematician',
            'Caesar': 'Letter Shifter',
            'Base64': 'Base64 Master',
            'Base32': 'Base32 Master',
            'Hex': 'Hex Master',
            'MD5': 'MD5 Master',
            'SHA-1': 'SHA-1 Master',
            'SHA-256': 'SHA-256 Master',
            'Vigenere': 'Vigenere Master'
        };

        const currentCategory = challenge.category;
        if (categoryMapper[currentCategory]) {
            const allOfCategory = currentChallenges.filter(c => c.category === currentCategory);
            const userSolvedInCategory = await db.get(
                'SELECT COUNT(DISTINCT challenge_id) as count FROM solves WHERE user_id = ? AND challenge_id IN (' + allOfCategory.map(() => '?').join(',') + ')',
                [req.user.id, ...allOfCategory.map(c => c.id)]
            );

            if (userSolvedInCategory.count === allOfCategory.length) {
                badgesToAward.push(categoryMapper[currentCategory]);
            }
        }

        // Grant Badges
        for (const badgeName of badgesToAward) {
            try {
                await db.run('INSERT OR IGNORE INTO user_badges (user_id, badge_name) VALUES (?, ?)', [req.user.id, badgeName]);
            } catch (err) {
                console.error(`Error awarding badge ${badgeName}:`, err);
            }
        }

        await db.run('COMMIT');

        res.json({ success: true, pointsAdded: challenge.points, newRank, earnedBadges: badgesToAward });
    } catch (err) {
        await db.run('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
