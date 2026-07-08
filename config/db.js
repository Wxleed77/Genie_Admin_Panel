// config/db.js
// -----------------------------------------------------------------------------
// Database Coordinator (Member 4) — isolates raw file operations.
//
// Storage: a single JSON file (database/genie.json) read/written synchronously.
// If Group 1 later integrates a real database client (MongoDB/MySQL/Postgres),
// only config/db.js and the model files need to change.
// -----------------------------------------------------------------------------

const fs = require("fs");
const os = require("os");
const path = require("path");

function getDbFilePath() {
  if (process.env.DB_FILE_PATH) return process.env.DB_FILE_PATH;

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "genie-admin-panel", "genie.json");
  }

  return path.join(__dirname, "..", "database", "genie.json");
}

const DB_FILE = getDbFilePath();

function ensureDbDir() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

function loadRaw() {
  ensureDbDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = { admins: [], products: [], nextAdminId: 1, nextProductId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

function saveRaw(data) {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { loadRaw, saveRaw };
