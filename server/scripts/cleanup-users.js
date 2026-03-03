const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../ctf.db');
const db = new sqlite3.Database(dbPath);

console.log('Connecting to database at:', dbPath);

db.serialize(() => {
    // Keep only AX1, 1, and shazly
    const keepUsers = ['AX1', '1', 'shazly'];
    const placeholders = keepUsers.map(() => '?').join(',');

    console.log('Cleaning up users...');
    db.run(`DELETE FROM users WHERE username NOT IN (${placeholders})`, keepUsers, function (err) {
        if (err) {
            console.error('Error during deletion:', err.message);
            process.exit(1);
        }
        console.log(`Deletion complete. Rows affected: ${this.changes}`);

        // Final check
        db.all("SELECT username FROM users", [], (err, rows) => {
            if (err) {
                console.error('Error during verification:', err.message);
            } else {
                console.log('Remaining users:', rows.map(r => r.username));
            }
            db.close();
        });
    });
});
