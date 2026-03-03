const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool;

async function getDb() {
  if (!pool) {
    const config = {
      host: process.env.TIDB_HOST,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      port: process.env.TIDB_PORT || 4000,
      database: process.env.TIDB_DB_NAME || 'test',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    // CA certificate for TiDB Cloud
    if (process.env.TIDB_CA_PATH) {
      config.ssl.ca = fs.readFileSync(process.env.TIDB_CA_PATH);
    }

    pool = mysql.createPool(config);

    // Initial Schema Setup
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE,
          password TEXT,
          points INT DEFAULT 0,
          rank VARCHAR(50) DEFAULT 'Beginner',
          bio TEXT,
          photo TEXT,
          gender VARCHAR(20),
          contact_type VARCHAR(50),
          contact_value VARCHAR(255),
          is_banned TINYINT(1) DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS solves (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          challenge_id VARCHAR(255),
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          badge_name VARCHAR(255),
          granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, badge_name),
          FOREIGN KEY(user_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS banned_ips (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ip VARCHAR(45) UNIQUE,
          reason TEXT,
          banned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } finally {
      connection.release();
    }
  }

  // Provide a compatibility layer for sqlite-style methods (get, all, run)
  return {
    get: async (sql, params) => {
      const [rows] = await pool.execute(sql.replace(/\?/g, '?'), params);
      return rows[0];
    },
    all: async (sql, params) => {
      const [rows] = await pool.execute(sql.replace(/\?/g, '?'), params);
      return rows;
    },
    run: async (sql, params) => {
      const [result] = await pool.execute(sql.replace(/\?/g, '?'), params);
      return { lastID: result.insertId, changes: result.affectedRows };
    },
    execute: async (sql, params) => {
      return await pool.execute(sql, params);
    }
  };
}

module.exports = { getDb };
