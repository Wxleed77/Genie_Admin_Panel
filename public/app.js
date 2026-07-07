// public/app.js
// Client-side logic for the admin dashboard: auth guard, product table render,
// add product, delete product, and price/discount popovers.

const productBody = document.getElementById("productBody");
const emptyState = document.getElementById("emptyState");
const addForm = document.getElementById("addForm");
const addMsg = document.getElementById("addMsg");
const whoami = document.getElementById("whoami");
const productCount = document.getElementById("productCount");
const logoutBtn = document.getElementById("logoutBtn");

function money(n) {
  return "Rs " + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function categoryBadge(cat) {
  const cls = cat === "Men" ? "badge-men" : cat === "Women" ? "badge-women" : "badge-junior";
  return `<span class="badge ${cls}">${cat}</span>`;
}

async function checkAuth() {
  const res = await fetch("/api/auth/status");
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = "login.html";
    return;
  }
  whoami.textContent = `— ${data.username}`;
}

async function loadProducts() {
  const res = await fetch("/api/products");
  if (res.status === 401) {
    window.location.href = "login.html";
    return;
  }
  const data = await res.json();
  renderProducts(data.data || []);
}

function renderProducts(products) {
  productBody.innerHTML = "";
  const activeCount = products.filter((p) => p.is_active).length;
  productCount.textContent = `${activeCount} live / ${products.length} total`;

  if (products.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  for (const p of products) {
    const tr = document.createElement("tr");
    if (!p.is_active) tr.classList.add("inactive-row");

    const hasDiscount = p.discount_type && p.sale_price < p.base_price;
    const priceHtml = hasDiscount
      ? `<div class="price-cell"><span class="base">${money(p.base_price)}</span><br/><span class="sale">${money(p.sale_price)}</span></div>`
      : `<div class="price-cell">${money(p.base_price)}</div>`;

    tr.innerHTML = `
      <td><strong>${escapeHtml(p.title)}</strong><br/><span style="color:var(--muted);font-size:12px;">${escapeHtml(p.description || "")}</span></td>
      <td>${categoryBadge(p.category)}</td>
      <td>${p.stock_quantity}</td>
      <td>${priceHtml}</td>
      <td>${p.is_active ? '<span style="color:var(--good);">Active</span>' : '<span style="color:var(--muted);">Removed</span>'}</td>
      <td>
        <div class="row-actions">
          <button class="mini-btn" data-action="price" data-id="${p.id}">Price</button>
          <button class="mini-btn" data-action="discount" data-id="${p.id}">Discount</button>
          ${p.is_active ? `<button class="mini-btn danger" data-action="delete" data-id="${p.id}">Delete</button>` : ""}
        </div>
      </td>
    `;
    productBody.appendChild(tr);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---- Add product ----
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  addMsg.textContent = "";
  addMsg.className = "form-msg";

  const payload = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    category: document.getElementById("category").value,
    base_price: parseFloat(document.getElementById("base_price").value),
    stock_quantity: parseInt(document.getElementById("stock_quantity").value, 10),
  };

  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (data.success) {
    addMsg.textContent = "Product added ✓";
    addMsg.classList.add("ok");
    addForm.reset();
    loadProducts();
  } else {
    addMsg.textContent = data.message || "Failed to add product.";
    addMsg.classList.add("err");
  }
});

// ---- Delete / Price / Discount actions (event delegation) ----
productBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "delete") {
    if (!confirm("Remove this product from the live panel?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  } else if (action === "price") {
    openPricePopover(btn, id);
  } else if (action === "discount") {
    openDiscountPopover(btn, id);
  }
});

function closePopovers() {
  document.querySelectorAll(".popover").forEach((el) => el.remove());
}

function positionPopover(el, anchorBtn) {
  const rect = anchorBtn.getBoundingClientRect();
  el.style.top = `${rect.bottom + 8}px`;
  let left = rect.left;
  if (left + 230 > window.innerWidth) left = window.innerWidth - 240;
  el.style.left = `${left}px`;
}

function openPricePopover(anchorBtn, id) {
  closePopovers();
  const pop = document.createElement("div");
  pop.className = "popover";
  pop.innerHTML = `
    <label>Amount (PKR)</label>
    <input type="number" min="0" step="0.01" id="popAmount" />
    <div class="popover-row">
      <button id="popIncrease">+ Increase</button>
      <button id="popDecrease">− Decrease</button>
    </div>
    <div class="popover-row"><button class="popover-close" id="popClose">Cancel</button></div>
  `;
  document.body.appendChild(pop);
  positionPopover(pop, anchorBtn);

  pop.querySelector("#popClose").onclick = closePopovers;
  pop.querySelector("#popIncrease").onclick = () => submitPrice(id, "increase");
  pop.querySelector("#popDecrease").onclick = () => submitPrice(id, "decrease");
}

async function submitPrice(id, direction) {
  const amount = parseFloat(document.getElementById("popAmount").value);
  if (Number.isNaN(amount) || amount < 0) return alert("Enter a valid amount.");
  await fetch(`/api/products/${id}/price`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, direction }),
  });
  closePopovers();
  loadProducts();
}

function openDiscountPopover(anchorBtn, id) {
  closePopovers();
  const pop = document.createElement("div");
  pop.className = "popover";
  pop.innerHTML = `
    <label>Discount Type</label>
    <select id="popType">
      <option value="percentage">Percentage (%)</option>
      <option value="fixed">Fixed Amount (PKR)</option>
    </select>
    <label>Value</label>
    <input type="number" min="0" step="0.01" id="popValue" />
    <div class="popover-row">
      <button id="popApply">Apply</button>
      <button id="popClear">Clear</button>
    </div>
    <div class="popover-row"><button class="popover-close" id="popClose">Cancel</button></div>
  `;
  document.body.appendChild(pop);
  positionPopover(pop, anchorBtn);

  pop.querySelector("#popClose").onclick = closePopovers;
  pop.querySelector("#popApply").onclick = () => submitDiscount(id);
  pop.querySelector("#popClear").onclick = () => clearDiscount(id);
}

async function submitDiscount(id) {
  const discount_type = document.getElementById("popType").value;
  const discount_value = parseFloat(document.getElementById("popValue").value);
  if (Number.isNaN(discount_value) || discount_value < 0) return alert("Enter a valid value.");
  const res = await fetch(`/api/products/${id}/discount`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discount_type, discount_value }),
  });
  const data = await res.json();
  if (!data.success) return alert(data.message || "Failed to apply discount.");
  closePopovers();
  loadProducts();
}

async function clearDiscount(id) {
  await fetch(`/api/products/${id}/discount`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discount_type: null }),
  });
  closePopovers();
  loadProducts();
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".popover") && !e.target.closest("[data-action]")) closePopovers();
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "login.html";
});

// ---- init ----
checkAuth().then(loadProducts);
