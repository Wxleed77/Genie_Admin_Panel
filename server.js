// server.js
// -----------------------------------------------------------------------------
// Group 2 — Admin Panel & Collaborative Backend
// Genie.pk Clone (E-Commerce Platform Deployment)
// -----------------------------------------------------------------------------

require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

// Static admin dashboard (isolated admin frontend, separate from Group 1's public site)
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Genie Admin Panel backend is running." });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Genie.pk Admin Panel backend running at http://localhost:${PORT}`);
  console.log(`   Admin dashboard: http://localhost:${PORT}/login.html\n`);
});
