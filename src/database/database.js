const Database = require("better-sqlite3");
const db = new Database("dbLinkMeUp.sqlite");

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

  const createSanctionsTable = `
    CREATE TABLE IF NOT EXISTS sanctions (
      userID TEXT PRIMARY KEY,

      nbWarn INTEGER DEFAULT 0,
      idWarns TEXT DEFAULT '[]', -- liste d’IDs en JSON
      reasonWarns TEXT DEFAULT '[]', -- liste des raisons en JSON

      nbMute INTEGER DEFAULT 0,
      idMutes TEXT DEFAULT '[]',
      reasonMutes TEXT DEFAULT '[]',
      muteTimes TEXT DEFAULT '[]', -- durées stockées en JSON (ms ou secondes)

      nbBan INTEGER DEFAULT 0,
      idBans TEXT DEFAULT '[]',
      reasonBans TEXT DEFAULT '[]'
    );
  `;
  db.exec(createSanctionsTable);
  console.log("Base de données prête (levels + sanctions).");
}

setupDatabase();
// Levels
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

// Sanctions

function getSanctions(userID) {
  const sql = `SELECT * FROM sanctions WHERE userID = ?`;
  const stmt = db.prepare(sql);
  return stmt.get(userID);
}

function initSanctions(userID) {
  const sql = `
    INSERT OR IGNORE INTO sanctions (userID) VALUES (?);
  `;
  const stmt = db.prepare(sql);
  stmt.run(userID);
}

function addWarn(userID, warnID, reason) {
  initSanctions(userID);
  const sanctions = getSanctions(userID);

  let ids = JSON.parse(sanctions.idWarns);
  let reasons = JSON.parse(sanctions.reasonWarns);

  ids.push(warnID);
  reasons.push(reason);

  const sql = `
    UPDATE sanctions
    SET nbWarn = nbWarn + 1,
        idWarns = ?,
        reasonWarns = ?
    WHERE userID = ?;
  `;
  const stmt = db.prepare(sql);
  stmt.run(JSON.stringify(ids), JSON.stringify(reasons), userID);
}

function addMute(userID, muteID, reason, duration) {
  initSanctions(userID);
  const sanctions = getSanctions(userID);

  let ids = JSON.parse(sanctions.idMutes);
  let reasons = JSON.parse(sanctions.reasonMutes);
  let times = JSON.parse(sanctions.muteTimes);

  ids.push(muteID);
  reasons.push(reason);
  times.push(duration);

  const sql = `
    UPDATE sanctions
    SET nbMute = nbMute + 1,
        idMutes = ?,
        reasonMutes = ?,
        muteTimes = ?
    WHERE userID = ?;
  `;
  const stmt = db.prepare(sql);
  stmt.run(
    JSON.stringify(ids),
    JSON.stringify(reasons),
    JSON.stringify(times),
    userID
  );
}

function addBan(userID, banID, reason) {
  initSanctions(userID);
  const sanctions = getSanctions(userID);

  let ids = JSON.parse(sanctions.idBans);
  let reasons = JSON.parse(sanctions.reasonBans);

  ids.push(banID);
  reasons.push(reason);

  const sql = `
    UPDATE sanctions
    SET nbBan = nbBan + 1,
        idBans = ?,
        reasonBans = ?
    WHERE userID = ?;
  `;
  const stmt = db.prepare(sql);
  stmt.run(JSON.stringify(ids), JSON.stringify(reasons), userID);
}

function removeWarn(userID, warnID) {
  const sanctions = getSanctions(userID);
  if (!sanctions) return;

  let ids = JSON.parse(sanctions.idWarns);
  let reasons = JSON.parse(sanctions.reasonWarns);

  const index = ids.indexOf(warnID);
  if (index === -1) return;

  ids.splice(index, 1);
  reasons.splice(index, 1);

  const sql = `
    UPDATE sanctions
    SET nbWarn = nbWarn - 1,
        idWarns = ?,
        reasonWarns = ?
    WHERE userID = ?;
  `;
  const stmt = db.prepare(sql);
  stmt.run(JSON.stringify(ids), JSON.stringify(reasons), userID);
}

function removeMute(userID, muteID) {
  const sanctions = getSanctions(userID);
  if (!sanctions) return;

  let ids = JSON.parse(sanctions.idMutes);
  let reasons = JSON.parse(sanctions.reasonMutes);
  let times = JSON.parse(sanctions.muteTimes);

  const index = ids.indexOf(muteID);
  if (index === -1) return;

  ids.splice(index, 1);
  reasons.splice(index, 1);
  times.splice(index, 1);

  const sql = `
    UPDATE sanctions
    SET nbMute = nbMute - 1,
        idMutes = ?,
        reasonMutes = ?,
        muteTimes = ?
    WHERE userID = ?;
  `;
  const stmt = db.prepare(sql);
  stmt.run(
    JSON.stringify(ids),
    JSON.stringify(reasons),
    JSON.stringify(times),
    userID
  );
}

function removeBan(userID, banID) {
  const sanctions = getSanctions(userID);
  if (!sanctions) return;

  let ids = JSON.parse(sanctions.idBans);
  let reasons = JSON.parse(sanctions.reasonBans);

  const index = ids.indexOf(banID);
  if (index === -1) return;

  ids.splice(index, 1);
  reasons.splice(index, 1);

  const sql = `
    UPDATE sanctions
    SET nbBan = nbBan - 1,
        idBans = ?,
        reasonBans = ?
    WHERE userID = ?;
  `;
  const stmt = db.prepare(sql);
  stmt.run(JSON.stringify(ids), JSON.stringify(reasons), userID);
}

module.exports = {
  getUser,
  setUser,
  getLeaderboard,

  getSanctions,
  addWarn,
  addMute,
  addBan,
  removeWarn,
  removeMute,
  removeBan,
};
