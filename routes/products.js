// routes/products.js
// -----------------------------------------------------------------------------
// Member 2 (Creation & Deletion Logic) + Member 3 (Price & Discount System)
//
//  - POST   /api/products               -> Add new product
//  - GET    /api/products               -> List ALL products (admin view)
//  - GET    /api/products/public        -> List only ACTIVE products (for
//                                           Group 1's live user panel to consume)
//  - DELETE /api/products/:id           -> Soft-delete (is_active = 0), i.e.
//                                           instantly vanishes from live panel
//  - PUT    /api/products/:id/price     -> Increase/decrease base price
//  - PUT    /api/products/:id/discount  -> Apply % or fixed discount
//
// All admin routes are protected by requireAuth (secure authentication gate).
// -----------------------------------------------------------------------------

const express = require("express");
const { products, VALID_CATEGORIES } = require("../models/product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Sale Price = Base Price - Discount (percentage or fixed)
function calculateSalePrice(basePrice, discountType, discountValue) {
  if (!discountType || !discountValue) return basePrice;

  let salePrice = basePrice;
  if (discountType === "percentage") {
    salePrice = basePrice - (basePrice * discountValue) / 100;
  } else if (discountType === "fixed") {
    salePrice = basePrice - discountValue;
  }
  return Math.max(0, Math.round(salePrice * 100) / 100);
}

// ---------------------------------------------------------------------------
// GET /api/products/public  (no auth — this is what Group 1's frontend calls)
// ---------------------------------------------------------------------------
router.get("/public", (req, res) => {
  const active = products.getActive().map(({ id, title, description, category, base_price, sale_price, stock_quantity }) => ({
    id, title, description, category, base_price, sale_price, stock_quantity,
  }));
  return res.json({ success: true, data: active });
});

// ---------------------------------------------------------------------------
// GET /api/products  (admin — sees everything, including inactive)
// ---------------------------------------------------------------------------
router.get("/", requireAuth, (req, res) => {
  return res.json({ success: true, data: products.getAll() });
});

// ---------------------------------------------------------------------------
// POST /api/products  (Add New Product)
// ---------------------------------------------------------------------------
router.post("/", requireAuth, (req, res) => {
  const { title, description, category, base_price, stock_quantity } = req.body;

  if (!title || !category || base_price === undefined || stock_quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "title, category, base_price, and stock_quantity are required.",
    });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
  }

  const price = Number(base_price);
  const stock = Number(stock_quantity);

  if (Number.isNaN(price) || price < 0 || Number.isNaN(stock) || stock < 0) {
    return res.status(400).json({ success: false, message: "base_price and stock_quantity must be valid non-negative numbers." });
  }

  const newProduct = products.create({ title, description, category, base_price: price, stock_quantity: stock });
  return res.status(201).json({ success: true, message: "Product added.", data: newProduct });
});

// ---------------------------------------------------------------------------
// DELETE /api/products/:id  (Instant Product Removal — soft delete)
// ---------------------------------------------------------------------------
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const product = products.getById(id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }

  products.softDelete(id);
  return res.json({ success: true, message: "Product removed from live panel." });
});

// ---------------------------------------------------------------------------
// PUT /api/products/:id/price  (Increase / decrease base price)
// body: { amount: number, direction: "increase" | "decrease" }
// ---------------------------------------------------------------------------
router.put("/:id/price", requireAuth, (req, res) => {
  const { id } = req.params;
  const { amount, direction } = req.body;

  const product = products.getById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }

  const delta = Number(amount);
  if (Number.isNaN(delta) || delta < 0 || !["increase", "decrease"].includes(direction)) {
    return res.status(400).json({ success: false, message: 'Provide a non-negative "amount" and direction "increase" or "decrease".' });
  }

  let newBasePrice = direction === "increase" ? product.base_price + delta : product.base_price - delta;
  newBasePrice = Math.max(0, Math.round(newBasePrice * 100) / 100);

  const newSalePrice = calculateSalePrice(newBasePrice, product.discount_type, product.discount_value);

  const updated = products.update(id, { base_price: newBasePrice, sale_price: newSalePrice });
  return res.json({ success: true, message: "Price updated.", data: updated });
});

// ---------------------------------------------------------------------------
// PUT /api/products/:id/discount  (Sale Engine)
// body: { discount_type: "percentage" | "fixed" | null, discount_value: number }
// ---------------------------------------------------------------------------
router.put("/:id/discount", requireAuth, (req, res) => {
  const { id } = req.params;
  const { discount_type, discount_value } = req.body;

  const product = products.getById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }

  // Allow clearing a discount entirely
  if (discount_type === null || discount_type === "none") {
    const cleared = products.update(id, { discount_type: null, discount_value: 0, sale_price: product.base_price });
    return res.json({ success: true, message: "Discount cleared.", data: cleared });
  }

  if (!["percentage", "fixed"].includes(discount_type)) {
    return res.status(400).json({ success: false, message: 'discount_type must be "percentage", "fixed", or null.' });
  }

  const value = Number(discount_value);
  if (Number.isNaN(value) || value < 0) {
    return res.status(400).json({ success: false, message: "discount_value must be a non-negative number." });
  }

  if (discount_type === "percentage" && value > 100) {
    return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100." });
  }

  const salePrice = calculateSalePrice(product.base_price, discount_type, value);
  const updated = products.update(id, { discount_type, discount_value: value, sale_price: salePrice });

  return res.json({ success: true, message: "Discount applied.", data: updated });
});

module.exports = router;
