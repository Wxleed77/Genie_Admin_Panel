// database/seed.js
// -----------------------------------------------------------------------------
// Run with: npm run seed
// Creates the default admin account (hashed with bcrypt) and drops in a few
// mock/fake products so Group 2 can build & test independently of Group 1's
// frontend, exactly as the assignment's "Independent Testing" section asks.
// -----------------------------------------------------------------------------

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { admins, products } = require("../config/db");

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = admins.findByUsername(username);
  if (existing) {
    console.log(`Admin "${username}" already exists — skipping.`);
    return;
  }

  const password_hash = bcrypt.hashSync(password, 10);
  admins.create({ username, password_hash });
  console.log(`✔ Admin created -> username: "${username}", password: "${password}"`);
  console.log('  (change ADMIN_PASSWORD in your .env and re-seed for real use)');
}

function seedProducts() {
  const existing = products.getAll();
  if (existing.length > 0) {
    console.log("Products already seeded — skipping mock inserts.");
    return;
  }

  const mockProducts = [
    { title: "Classic Denim Jacket", description: "Unisex casual denim jacket", category: "Men", base_price: 4500, stock_quantity: 25 },
    { title: "Floral Summer Dress", description: "Lightweight cotton dress", category: "Women", base_price: 3200, stock_quantity: 40 },
    { title: "Kids Graphic Tee", description: "Printed cotton t-shirt", category: "Junior", base_price: 950, stock_quantity: 60 },
    { title: "Slim Fit Chinos", description: "Formal/casual chino trousers", category: "Men", base_price: 2800, stock_quantity: 30 },
    { title: "Embroidered Kurti", description: "Traditional embroidered kurti", category: "Women", base_price: 2600, stock_quantity: 18 },
  ];

  for (const p of mockProducts) products.create(p);
  console.log(`✔ Inserted ${mockProducts.length} mock products.`);
}

seedAdmin();
seedProducts();
console.log("Seeding complete.");
