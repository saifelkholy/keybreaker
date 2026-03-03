const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    const { search, limit } = req.query;
    const db = await getDb();

    let sqlLimit = 50;
    if (limit === 'all') {
        sqlLimit = -1; // SQLite use -1 for no limit
    } else if (limit && !isNaN(limit)) {
        sqlLimit = parseInt(limit);
    }

    let query = 'SELECT username, points, rank, photo FROM users ORDER BY points DESC';
    let params = [];

    if (search) {
        query = 'SELECT username, points, rank, photo FROM users WHERE username LIKE ? ORDER BY points DESC';
        params = [`%${search}%`];
    }

    if (sqlLimit !== -1) {
        query += ' LIMIT ?';
        params.push(sqlLimit);
    }

    const leaderboard = await db.all(query, params);
    res.json(leaderboard);
});

module.exports = router;
