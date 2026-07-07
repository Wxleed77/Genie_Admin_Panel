// middleware/auth.js
// -----------------------------------------------------------------------------
// Member 1 (Security & Auth): Guards every admin-only route.
// The Admin Panel must be completely inaccessible to regular users, so any
// request without a valid session is rejected before it reaches a controller.
// -----------------------------------------------------------------------------

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
}

module.exports = { requireAuth };
