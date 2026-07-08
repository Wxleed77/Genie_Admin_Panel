// models/admin.js
// -----------------------------------------------------------------------------
// Admin Model — interfaces the Admin schema.
// Can be replaced with a real database client model (e.g. Mongoose or SQL).
// -----------------------------------------------------------------------------

const { loadRaw, saveRaw } = require("../config/db");

const admins = {
  findByUsername(username) {
    const data = loadRaw();
    return data.admins.find((a) => a.username === username) || null;
  },

  create({ username, password_hash }) {
    const data = loadRaw();
    const admin = {
      id: data.nextAdminId,
      username,
      password_hash,
      created_at: new Date().toISOString(),
    };
    data.admins.push(admin);
    data.nextAdminId += 1;
    saveRaw(data);
    return admin;
  },
};

module.exports = { admins };
