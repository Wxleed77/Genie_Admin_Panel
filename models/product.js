// models/product.js
// -----------------------------------------------------------------------------
// Product Model — interfaces the Product schema.
// Can be replaced with a real database client model (e.g. Mongoose or SQL).
// -----------------------------------------------------------------------------

const { loadRaw, saveRaw } = require("../config/db");

const VALID_CATEGORIES = ["Men", "Women", "Junior"];

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

module.exports = { products, VALID_CATEGORIES };
