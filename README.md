# Genie.pk Clone — Admin Panel & Collaborative Backend (Group 2)

A secure admin control center built for the assignment: **Secure Authentication, Backend CRUD
Operations, and Price/Discount Management**, on a shared, lockable database schema.

## Stack
- **Node.js + Express** — REST API server
- **JSON file store** (pure JS, zero native dependencies) — lives at `database/genie.json`
- **bcryptjs** — password hashing for the admin account
- **express-session** — server-side login sessions (cookie-based)
- Plain HTML/CSS/JS admin dashboard (no framework needed)

> Using a plain JSON file instead of MongoDB/MySQL means this runs immediately with
> `npm install` on any machine — no database server, no native compiler, nothing to configure.
> If Group 1's engineer needs a real client-server database later, only `config/db.js`
> needs to change — the field "contract" described below can stay identical.

## 1. Install & Run (VS Code)

```bash
# 1. Open this folder in VS Code, then in the integrated terminal:
npm install

# 2. Copy the environment template and (optionally) edit admin credentials
cp .env.example .env

# 3. Seed the database: creates the admin account + 5 mock products
npm run seed

# 4. Start the server
npm start
```

Then open:
- **Admin Login:** http://localhost:5000/login.html
- **Default credentials:** `admin` / `admin123` (from `.env.example` — change before real use)

## 2. Project Structure

```
genie-admin-panel/
├── server.js              # Express app entry point
├── config/db.js           # SQLite connection + shared schema (products, admins)
├── database/seed.js        # Creates admin account + mock/fake test products
├── middleware/auth.js       # requireAuth guard — blocks non-admin requests
├── routes/auth.js         # POST /login, POST /logout, GET /status
├── routes/products.js     # Product CRUD + price/discount engine
└── public/                 # Admin dashboard frontend (login.html, dashboard.html, app.js)
```

## 3. Shared Database Schema (Day 1 Coordination)

This is the locked contract Group 1's frontend/DB engineer should build against.

**`products` table**
| Column          | Type    | Notes                                      |
|-----------------|---------|---------------------------------------------|
| id              | INTEGER | Primary key                                 |
| title           | TEXT    | Product name                                |
| description     | TEXT    |                                              |
| category        | TEXT    | One of: `Men`, `Women`, `Junior`            |
| base_price      | REAL    | Original price                              |
| stock_quantity  | INTEGER |                                              |
| discount_type   | TEXT    | `percentage`, `fixed`, or `NULL`            |
| discount_value  | REAL    | e.g. `20` for 20% or Rs 20                  |
| sale_price      | REAL    | `base_price - discount` (auto-calculated)   |
| is_active       | INTEGER | `1` = visible to users, `0` = soft-deleted  |

**`admins` table:** `id`, `username`, `password_hash` (bcrypt), `created_at`.

## 4. API Reference

| Method | Endpoint                       | Auth | Purpose                              |
|--------|---------------------------------|------|----------------------------------------|
| POST   | `/api/auth/login`                | No   | Log in, starts session                 |
| POST   | `/api/auth/logout`               | Yes  | Ends session                            |
| GET    | `/api/auth/status`                | No   | Check if logged in                      |
| GET    | `/api/products`                   | Yes  | List all products (admin view)          |
| GET    | `/api/products/public`            | No   | List only active products — **this is the endpoint Group 1's live user panel should call** |
| POST   | `/api/products`                   | Yes  | Add a new product                       |
| DELETE | `/api/products/:id`                | Yes  | Soft-delete (instantly hides from public)|
| PUT    | `/api/products/:id/price`          | Yes  | `{ amount, direction: "increase"\|"decrease" }` |
| PUT    | `/api/products/:id/discount`       | Yes  | `{ discount_type: "percentage"\|"fixed"\|null, discount_value }` |

All admin endpoints require an active session cookie (log in via the dashboard first, or via
`/api/auth/login` if testing with Postman/curl with cookies enabled).

## 5. Testing Independently (per assignment's "Independent Testing" note)

`npm run seed` inserts 5 mock products across all three categories so you can test
add/delete/price/discount flows immediately without waiting on Group 1's frontend.

## 6. Video Report Checklist (for Member 5 / Team Lead)

The dashboard supports walking through, in order:
1. **Login security** — try a wrong password (rejected), then the correct one (session starts).
2. **Add a test product** — use the left-hand form.
3. **Delete a test product** — click Delete, confirm it disappears (and check
   `GET /api/products/public` no longer returns it).
4. **Adjust price/discount** — use the Price and Discount buttons on any row, and show the
   `sale_price` column updating instantly in the table.

## 7. Security Notes
- Passwords are hashed with bcrypt (`bcryptjs`), never stored in plain text.
- Sessions are `httpOnly` cookies — inaccessible to client-side JS/XSS.
- All product-mutating routes are behind `requireAuth`; only `GET /api/products/public`
  is open, matching "Admin Panel must be completely inaccessible to regular users."
- Change `SESSION_SECRET` and `ADMIN_PASSWORD` in `.env` before any real deployment.
