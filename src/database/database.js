const Database = require("better-sqlite3");
const crypto = require("crypto");
const db = new Database("dbLinkMeUp.sqlite");

function setupDatabase() {
  const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            userID TEXT PRIMARY KEY,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 0,
            lastMessageTimestamp INTEGER DEFAULT 0
        );
    `;
  db.exec(createUsersTable);

  const createSanctionsTable = `
        CREATE TABLE IF NOT EXISTS sanctions (
            sanctionID TEXT PRIMARY KEY,
            userID TEXT NOT NULL,
            type TEXT NOT NULL, -- 'warn', 'mute', 'ban'
            reason TEXT,
            moderatorID TEXT NOT NULL,
            duration INTEGER, -- Uniquement pour les mutes (en millisecondes)
            createdAt INTEGER NOT NULL
        );
    `;
  db.exec(createSanctionsTable);
  console.log("Base de données prête (users + sanctions).");
}

setupDatabase();

function getUser(userID) {
  const stmt = db.prepare(`SELECT * FROM users WHERE userID = ?`);
  let user = stmt.get(userID);
  if (!user) {
    const insertStmt = db.prepare(`INSERT INTO users (userID) VALUES (?)`);
    insertStmt.run(userID);
    user = { userID, xp: 0, level: 0, lastMessageTimestamp: 0 };
  }
  return user;
}

function setUser(userID, xp, level, lastMessageTimestamp) {
  const stmt = db.prepare(`
        INSERT INTO users (userID, xp, level, lastMessageTimestamp)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userID) DO UPDATE SET
            xp = excluded.xp,
            level = excluded.level,
            lastMessageTimestamp = excluded.lastMessageTimestamp;
    `);
  stmt.run(userID, xp, level, lastMessageTimestamp);
}

function getLeaderboard() {
  const stmt = db.prepare(
    `SELECT userID, xp, level FROM users ORDER BY xp DESC LIMIT 10`
  );
  return stmt.all();
}

function addSanction(userID, moderatorID, type, reason, duration = null) {
  const sanctionID = crypto.randomUUID();
  const createdAt = Date.now();
  const stmt = db.prepare(`
        INSERT INTO sanctions (sanctionID, userID, moderatorID, type, reason, duration, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `);
  stmt.run(sanctionID, userID, moderatorID, type, reason, duration, createdAt);
  return sanctionID;
}

function removeSanction(sanctionID) {
  const stmt = db.prepare(`DELETE FROM sanctions WHERE sanctionID = ?`);
  stmt.run(sanctionID);
}

function getSanctions(userID, type = null) {
  let sql = `SELECT * FROM sanctions WHERE userID = ?`;
  const params = [userID];
  if (type) {
    sql += ` AND type = ?`;
    params.push(type);
  }
  sql += ` ORDER BY createdAt DESC`;

  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function addWarn(userID, moderatorID, reason) {
  return addSanction(userID, moderatorID, "warn", reason);
}

function addMute(userID, moderatorID, reason, duration) {
  return addSanction(userID, moderatorID, "mute", reason, duration);
}

function addBan(userID, moderatorID, reason) {
  return addSanction(userID, moderatorID, "ban", reason);
}

module.exports = {
  getUser,
  setUser,
  getLeaderboard,
  getSanctions,
  addWarn,
  addMute,
  addBan,
  removeSanction,
};
