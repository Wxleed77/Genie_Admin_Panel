// routes/auth.js
// -----------------------------------------------------------------------------
// Member 1 (Security & Auth): Secure Admin Login interface.
// Credentials are hashed with bcrypt (industry-standard). Login state is kept
// server-side via express-session so the isolated admin route stays separate
// from Group 1's public user routing.
// -----------------------------------------------------------------------------

const express = require("express");
const bcrypt = require("bcryptjs");
const { admins } = require("../models/admin");

const router = express.Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  const admin = admins.findByUsername(username);

  if (!admin) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const isValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  req.session.adminId = admin.id;
  req.session.username = admin.username;

  return res.json({ success: true, message: "Login successful.", username: admin.username });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session = null;
  res.clearCookie("genie_admin_session");
  return res.json({ success: true, message: "Logged out." });
});

// GET /api/auth/status
router.get("/status", (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  return res.json({ loggedIn: false });
});

module.exports = router;
