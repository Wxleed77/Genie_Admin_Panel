// config/db.js
// -----------------------------------------------------------------------------
// Database Coordinator (Member 4) — this file defines the LOCKED shared schema
// and the storage engine.
//
// Storage: a single JSON file (database/genie.json) read/written synchronously.
// This is deliberately dependency-free (no better-sqlite3 / no native builds)
// so `npm install` works instantly on any machine, with no compiler required.
// If Group 1 later needs a real client-server database (MongoDB/MySQL/Postgres),
// only this file needs to change — the fields below are the shared "contract"
// and should not change without re-locking with Group 1.
// -----------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "database", "genie.json");

function loadRaw() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { admins: [], products: [], nextAdminId: 1, nextProductId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

function saveRaw(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const VALID_CATEGORIES = ["Men", "Women", "Junior"];

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const products = {
  getAll() {
    const data = loadRaw();
    return [...data.products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getActive() {
    return this.getAll().filter((p) => p.is_active === 1);
  },

  getById(id) {
    const data = loadRaw();
    return data.products.find((p) => p.id === Number(id)) || null;
  },

  create({ title, description, category, base_price, stock_quantity }) {
    const data = loadRaw();
    const now = new Date().toISOString();
    const product = {
      id: data.nextProductId,
      title,
      description: description || "",
      category,
      base_price,
      stock_quantity,
      discount_type: null,
      discount_value: 0,
      sale_price: base_price,
      is_active: 1,
      created_at: now,
      updated_at: now,
    };
    data.products.push(product);
    data.nextProductId += 1;
    saveRaw(data);
    return product;
  },

  update(id, updates) {
    const data = loadRaw();
    const idx = data.products.findIndex((p) => p.id === Number(id));
    if (idx === -1) return null;
    data.products[idx] = {
      ...data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveRaw(data);
    return data.products[idx];
  },

  softDelete(id) {
    return this.update(id, { is_active: 0 });
  },
};

module.exports = { admins, products, VALID_CATEGORIES };
