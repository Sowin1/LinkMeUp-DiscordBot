const Database = require("better-sqlite3");
const db = new Database("leveling.sqlite");

function setupDatabase() {
  const createTable = `
    CREATE TABLE IF NOT EXISTS levels (
      userID TEXT PRIMARY KEY,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      lastMessageTimestamp INTEGER DEFAULT 0 
    );
  `;
  db.exec(createTable);
  console.log("Base de données prête.");
}

setupDatabase();

function getUser(userID) {
  const sql = `SELECT * FROM levels WHERE userID = ?`;
  const stmt = db.prepare(sql);
  return stmt.get(userID);
}

function setUser(userID, xp, level) {
  const sql = `
        INSERT INTO levels (userID, xp, level, lastMessageTimestamp) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userID) DO UPDATE SET
        xp = excluded.xp,
        level = excluded.level,
        lastMessageTimestamp = excluded.lastMessageTimestamp;
    `;
  const stmt = db.prepare(sql);
  stmt.run(userID, xp, level, Date.now());
}

function getLeaderboard() {
  const sql = `SELECT * FROM levels ORDER BY xp DESC
  LIMIT 10;
  `;
  const stmt = db.prepare(sql);
  return stmt.all();
}

module.exports = {
  getUser,
  setUser,
  getLeaderboard,
};
