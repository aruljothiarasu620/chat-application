const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;

  dbPromise = open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  const db = await dbPromise;

  // Create tables if they don't exist
  await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (user1_id, user2_id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

  return db;
}

// Wrapper to mimic mysql2/promise .query() behavior
const dbWrapper = {
  async query(sql, params = []) {
    const db = await getDb();
    const lowerSql = sql.trim().toLowerCase();

    if (lowerSql.startsWith('select')) {
      const rows = await db.all(sql, params);
      return [rows]; // Return [rows, fields] like mysql2
    } else if (lowerSql.startsWith('insert')) {
      const result = await db.run(sql, params);
      return [{ insertId: result.lastID }]; // Return [info] like mysql2
    } else if (lowerSql.startsWith('update') || lowerSql.startsWith('delete')) {
      const result = await db.run(sql, params);
      return [{ affectedRows: result.changes }];
    } else {
      return await db.run(sql, params);
    }
  }
};

module.exports = dbWrapper;
