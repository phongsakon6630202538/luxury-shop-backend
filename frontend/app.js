const API = "https://luxury-shop-backend.onrender.com/products";


let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
const quantities = {};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("products")) loadProducts();
  if (document.getElementById("cart-count")) updateCartCount();
  if (document.getElementById("admin-product-list")) loadAdminProducts();
  if (document.getElementById("cart-items")) renderCart();

  // image modal
  window.imageModal = document.getElementById("image-modal");
  window.imgFull = document.getElementById("img-full");
  window.modalCaption = document.getElementById("modal-caption");
});

/* ================= SHOP ================= */
async function loadProducts() {
  const res = await fetch(API);
  const data = await res.json();

  products = data;
  renderProducts(products);
}

function renderProducts(list) {
  const container = document.getElementById("products");
  if (!container) return;
  container.innerHTML = "";

  list.forEach(p => {
    quantities[p._id] = quantities[p._id] || 1;

    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <div class="image-wrapper">
        <img src="${p.image}" onclick="openImage('${p.image}','${p.name}')">
      </div>

      <h3>${p.name}</h3>
      <p>${p.price.toLocaleString()} THB</p>
      <p>Stock: ${p.stock}</p>

 <div class="add-cart-wrap" data-id="${p._id}">
  <div class="add-cart-main">
    <span class="add-text">Add to Cart</span>

    <div class="qty-inside">
      <button class="qty-btn minus">−</button>
      <span id="qty-${p._id}">1</span>
      <button class="qty-btn plus">+</button>
    </div>
  </div>
</div>


    `;
    container.appendChild(div);
  });
}

/* ===== Quantity logic ===== */
function changeQty(id, val) {
  quantities[id] = Math.max(1, quantities[id] + val);
  const el = document.getElementById(`qty-${id}`);
  if (el) el.innerText = quantities[id];
}

/* ===== Add to cart ===== */
function addToCart(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;

  const qty = quantities[id] || 1;

  const exist = cart.find(i => i.id === id);
  if (exist) {
    exist.qty += qty;
  } else {
    cart.push({
      id,
      name: p.name,
      price: p.price,
      image: p.image,
      qty
    });
  }

  // ✅ บันทึก
  localStorage.setItem("cart", JSON.stringify(cart));

  // ✅ อัปเดต UI
  updateCartCount();

  // ✅ reset จำนวน (สำคัญมาก)
  quantities[id] = 1;
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.innerText = "1";
}


/* ===== Click handler for Add / + / − ===== */
document.addEventListener("click", e => {
  const wrap = e.target.closest(".add-cart-wrap");
  if (!wrap) return;

  const id = wrap.dataset.id;

  // ➕ กด + = เพิ่มเข้า cart ทีละ 1 (ไม่ยุ่ง quantities)
  if (e.target.classList.contains("plus")) {
    e.stopPropagation();
    addOneToCart(id);     // ⭐ เพิ่มทีละ 1
    return;
  }

  // ➖ กด − = ลดจาก cart ทีละ 1
  if (e.target.classList.contains("minus")) {
    e.stopPropagation();
    removeOneFromCart(id);
    return;
  }

  // 🛒 Add to Cart = เพิ่มตามจำนวนที่เลือกไว้
  if (e.target.closest(".add-cart-main")) {
    addToCart(id);
  }
});

function removeOneFromCart(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty -= 1;

  // ถ้าเหลือ 0 → ลบออก
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function addOneToCart(id) {
  const p = products.find(x => x._id === id);
  if (!p) return;

  const exist = cart.find(i => i.id === id);
  if (exist) {
    exist.qty += 1;
  } else {
    cart.push({
      id,
      name: p.name,
      price: p.price,
      image: p.image,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function removeOneFromCart(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty -= 1;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

/* ===== Cart count ===== */
function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  el.innerText = `(${cart.reduce((s, i) => s + i.qty, 0)})`;
}

/* ===== Filter + Search ===== */
function filterByCategory(cat, btn) {
  document.querySelectorAll(".category-menu button")
    .forEach(b => b.classList.remove("active"));

  if (btn) btn.classList.add("active");

  if (cat === "All") renderProducts(products);
  else renderProducts(products.filter(p => p.category === cat));
}

function searchProducts() {
  const k = document.getElementById("search-input").value.toLowerCase();
  renderProducts(products.filter(p => p.name.toLowerCase().includes(k)));
}

/* ================= CART PAGE ================= */
function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("total-price");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <p>Your cart is empty</p>
        <a href="index.html" class="back-shop">Back to shop</a>
      </div>
    `;
    totalEl.innerText = "Total: 0 THB";
    return;
  }

  container.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    const sum = item.price * item.qty;
    total += sum;

    container.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}">
        <div class="cart-info">
          <h4>${item.name}</h4>
          <p>${item.price.toLocaleString()} × ${item.qty}</p>
          <strong>${sum.toLocaleString()} THB</strong>
          <button onclick="removeItem(${i})">Remove</button>
        </div>
      </div>
    `;
  });

  totalEl.innerText = "Total: " + total.toLocaleString() + " THB";
}


function removeItem(i) {
  cart.splice(i, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

/* ================= IMAGE MODAL ================= */
function openImage(src) {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImg");

  img.src = src;
  img.classList.remove("zoomed");
  img.style.transform = "";

  modal.classList.add("show");

  // กันคลิกปิด modal ตอนแตะรูป
  img.onclick = e => {
    e.stopPropagation();
    img.classList.toggle("zoomed");
  };
}

function closeImageModal() {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImg");

  img.classList.remove("zoomed");
  img.style.transform = "";
  modal.classList.remove("show");
}


function closeImageModal() {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImg");

  img.classList.remove("zoomed");
  img.style.transform = "scale(1) translate(0,0)";
  modal.classList.remove("show");
}

// ===== IMAGE MODAL =====
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const modalCaption = document.getElementById("modalCaption");

/* ================= ADMIN ================= */
async function loadAdminProducts() {
  const res = await fetch(API);
  const list = await res.json();
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  tbody.innerHTML = "";
  list.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${p.image}" width="60"></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.price}</td>
        <td>${p.stock}</td>
        <td>
          <button class="btn-edit" onclick="openEdit('${p._id}')">Edit</button>
          <button class="btn-delete" onclick="deleteProduct('${p._id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

async function deleteProduct(id) {
  if (!confirm("Delete?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE" });
  loadAdminProducts();
}

async function openEdit(id) {
  const p = await (await fetch(`${API}/${id}`)).json();

  editId.value = p._id;
  editName.value = p.name;
  editCategory.value = p.category;
  editPrice.value = p.price;
  editStock.value = p.stock;
  editImage.value = p.image;

  editModal.classList.add("show");
}

async function saveEdit() {
  await fetch(`${API}/${editId.value}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: editName.value,
      category: editCategory.value,
      price: Number(editPrice.value),
      stock: Number(editStock.value),
      image: editImage.value
    })
  });

  closeEdit();
  loadAdminProducts();
}

function closeEdit() {
  editModal.classList.remove("show");
}
let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;

const img = document.getElementById("modalImg");

img.addEventListener("mousedown", e => {
  if (!img.classList.contains("zoomed")) return;
  isDragging = true;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
});

document.addEventListener("mousemove", e => {
  if (!isDragging) return;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  img.style.transform = `scale(2) translate(${currentX}px, ${currentY}px)`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});
