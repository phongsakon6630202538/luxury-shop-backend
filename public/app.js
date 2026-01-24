/* ================= CONFIG ================= */
const API = "https://luxury-shop-backend.onrender.com";
const PRODUCT_API = `${API}/products`;

/* ================= HELPER ================= */
function $(id) {
  return document.getElementById(id);
}

/* ================= GLOBAL STATE ================= */
let products = [];
let adminProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ================= SHOP ================= */
async function loadProducts() {
  const list = $("products");
  if (!list) return;

  const res = await fetch(PRODUCT_API);
  products = await res.json();

  renderProducts(products);
}

function renderProducts(items) {
  const list = $("products");
  if (!list) return;

  list.innerHTML = "";
  items.forEach(p => {
    list.innerHTML += `
      <div class="product">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>${p.price} ฿</p>
        <button onclick="addToCart('${p._id}')">Add to Cart</button>
      </div>
    `;
  });
}

/* ================= SEARCH ================= */
function searchProducts() {
  const input = $("search-input");
  if (!input) return;

  const k = input.value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(k)
  );
  renderProducts(filtered);
}

/* ================= CART ================= */
function addToCart(id) {
  const product = products.find(p => p._id === id);
  if (!product) return;

  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const el = $("cart-count");
  if (!el) return;

  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  el.textContent = `(${total})`;
}

function renderCart() {
  const list = $("cart-items");
  if (!list) return;

  list.innerHTML = "";

  cart.forEach(item => {
    const p = products.find(x => x._id === item.id);
    if (!p) return;

    list.innerHTML += `
      <div class="cart-item">
        <span>${p.name}</span>
        <span>x ${item.qty}</span>
      </div>
    `;
  });
}

/* ================= CHECKOUT ================= */
const checkoutForm = $("checkoutForm");
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async e => {
    e.preventDefault();

    const order = {
      name: $("name").value,
      phone: $("phone").value,
      email: $("email").value,
      address: $("address").value,
      cart
    };

    const res = await fetch(`${API}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    if (!res.ok) {
      alert("Checkout failed");
      return;
    }

    localStorage.removeItem("cart");
    window.location.href = "success.html";
  });
}

/* ================= ADMIN LIST ================= */
async function loadAdminProducts() {
  const tbody = $("admin-product-list");
  if (!tbody) return;

  const res = await fetch(PRODUCT_API);
  adminProducts = await res.json();

  tbody.innerHTML = "";
  adminProducts.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.price}</td>
        <td>${p.stock}</td>
        <td>
          <button onclick="goEdit('${p._id}')">Edit</button>
          <button onclick="deleteProduct('${p._id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

function goEdit(id) {
  window.location.href = `admin-edit.html?id=${id}`;
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  await fetch(`${PRODUCT_API}/${id}`, { method: "DELETE" });
  loadAdminProducts();
}

/* ================= ADD PRODUCT ================= */
async function addProduct() {
  const formData = new FormData();
  formData.append("name", $("name").value);
  formData.append("category", $("category").value);
  formData.append("price", $("price").value);
  formData.append("stock", $("stock").value);
  formData.append("image", $("image").files[0]);

  const res = await fetch(PRODUCT_API, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert("Add failed");
    return;
  }

  loadAdminProducts();
}

/* ================= EDIT PAGE (METHOD B) ================= */
const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

if (editId) {
  loadEditProduct(editId);
}

async function loadEditProduct(id) {
  const res = await fetch(PRODUCT_API);
  const items = await res.json();
  const p = items.find(x => x._id === id);
  if (!p) return;

  $("editName").value = p.name;
  $("editCategory").value = p.category;
  $("editPrice").value = p.price;
  $("editStock").value = p.stock;
}

async function saveEdit() {
  const formData = new FormData();
  formData.append("name", $("editName").value);
  formData.append("category", $("editCategory").value);
  formData.append("price", $("editPrice").value);
  formData.append("stock", $("editStock").value);

  const img = $("editImage").files[0];
  if (img) formData.append("image", img);

  const res = await fetch(`${PRODUCT_API}/${editId}`, {
    method: "PUT",
    body: formData
  });

  if (!res.ok) {
    alert("Update failed");
    return;
  }

  window.location.href = "admin.html";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  if ($("products")) loadProducts();
  if ($("admin-product-list")) loadAdminProducts();
  if ($("cart-count")) updateCartCount();

  const searchInput = $("search-input");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchProducts);
  }

  if ($("cart-items")) {
    loadProducts().then(renderCart);
  }
});
