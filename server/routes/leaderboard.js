const express = require('express');
const { getDb } = require('../database');

const router = express.Router();

router.get('/', async (req, res) => {
    const { search, limit } = req.query;
    const db = await getDb();

    let query = 'SELECT username, points, rank, photo FROM users';
    let params = [];
    let limitClause = ' LIMIT 50';

    if (limit === 'all') {
        limitClause = '';
    } else if (limit && !isNaN(parseInt(limit))) {
        limitClause = ` LIMIT ${parseInt(limit)}`;
    }

    if (search) {
        query += ' WHERE username LIKE ? ORDER BY points DESC' + limitClause;
        params = [`%${search}%`];
    } else {
        query += ' ORDER BY points DESC' + limitClause;
    }

    const leaderboard = await db.all(query, params);
    res.json(leaderboard);
});

module.exports = router;
