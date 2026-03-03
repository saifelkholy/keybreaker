const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

async function seed() {
    console.log('Starting seed process for 200,000 users...');
    const dbPath = path.join(__dirname, '../ctf.db');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Pre-hash a password to save 199,999 hashing operations
    // This makes the script run in seconds rather than hours.
    console.log('Generating base hash...');
    const dummyHash = await bcrypt.hash('dummy_pass_123', 10);

    const TOTAL_USERS = 200000;
    const BATCH_SIZE = 10000;

    const ranks = ['Beginner', 'Amateur', 'Pro', 'Elite', 'Hash Breaker', 'Legend'];

    console.log('Beginning insertion...');
    const startTime = Date.now();

    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
        await db.run('BEGIN TRANSACTION');
        const stmt = await db.prepare('INSERT OR IGNORE INTO users (username, password, points, rank) VALUES (?, ?, ?, ?)');

        for (let j = 0; j < BATCH_SIZE; j++) {
            const userId = i + j;
            if (userId >= TOTAL_USERS) break;

            const username = `agent_${userId.toString().padStart(6, '0')}`;
            // We use different passwords in plain text concept, but stored as the same hash for efficiency
            // In a real scenario, we'd hash each, but for 200k dummy rows, this is the only viable way in a script.
            const points = Math.floor(Math.random() * (100000 - 50 + 1)) + 50;
            const rank = ranks[Math.floor(Math.random() * ranks.length)];

            await stmt.run(username, dummyHash, points, rank);
        }

        await stmt.finalize();
        await db.run('COMMIT');

        const progress = (((i + BATCH_SIZE) / TOTAL_USERS) * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + BATCH_SIZE}/${TOTAL_USERS})`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Successfully seeded ${TOTAL_USERS} users in ${duration}s.`);

    await db.close();
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
