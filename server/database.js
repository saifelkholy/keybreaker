const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let db;

async function getDb() {
  if (!db) {
    db = await open({
      filename: './ctf.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        points INTEGER DEFAULT 0,
        rank TEXT DEFAULT 'Beginner',
        bio TEXT,
        photo TEXT,
        gender TEXT,
        contact_type TEXT,
        contact_value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS solves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        challenge_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);

    // Migration helper for existing tables
    try {
      const columns = await db.all("PRAGMA table_info(users)");
      const columnNames = columns.map(c => c.name);

      if (!columnNames.includes('bio')) await db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
      if (!columnNames.includes('photo')) await db.exec("ALTER TABLE users ADD COLUMN photo TEXT");
      if (!columnNames.includes('gender')) await db.exec("ALTER TABLE users ADD COLUMN gender TEXT");
      if (!columnNames.includes('contact_type')) await db.exec("ALTER TABLE users ADD COLUMN contact_type TEXT");
      if (!columnNames.includes('contact_value')) await db.exec("ALTER TABLE users ADD COLUMN contact_value TEXT");
      if (!columnNames.includes('is_banned')) await db.exec("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");

      // Banned IPs table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS banned_ips (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip TEXT UNIQUE,
          reason TEXT,
          banned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.log("Migration skipped or error:", e.message);
    }
  }
  return db;
}

module.exports = { getDb };
