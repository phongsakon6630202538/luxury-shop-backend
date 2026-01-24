const API = "https://luxury-shop-backend.onrender.com";
const PRODUCT_API = `${API}/products`;


let adminProducts = [];
let products = [];
let adminCurrentCategory = "all";
let adminSearchKeyword = "";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
const quantities = {};

// ===== ADMIN EDIT ELEMENTS =====
let editModal, editId, editName, editCategory, editPrice, editStock, editImage;

document.addEventListener("DOMContentLoaded", () => {

  /* ===== SHOP ===== */
  if (document.getElementById("products")) {
    loadProducts();
  }

  if (document.getElementById("cart-count")) {
    updateCartCount();
  }

  /* ===== CART ===== */
  if (document.getElementById("cart-items")) {
    renderCart();
  }

  /* ===== ADMIN (EDIT MODAL) ===== */
  editModal    = document.getElementById("editModal");

  // 👉 ถ้ามี modal แสดงว่าอยู่หน้า admin-edit.html
  if (editModal) {
    loadAdminProducts();

    editId       = document.getElementById("editId");
    editName     = document.getElementById("editName");
    editCategory = document.getElementById("editCategory");
    editPrice    = document.getElementById("editPrice");
    editStock    = document.getElementById("editStock");
    editImage    = document.getElementById("editImage");
  }

  /* ===== IMAGE MODAL (ถ้ามี) ===== */
  window.imageModal   = document.getElementById("image-modal");
  window.imgFull      = document.getElementById("img-full");
  window.modalCaption = document.getElementById("modal-caption");
});

/* ================= ADD PRODUCT ================= */
async function addProduct() {
  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("stock", document.getElementById("stock").value);
  formData.append("image", document.getElementById("image").files[0]);

  const res = await fetch(`${API}/products`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert("Add failed");
    return;
  }

  loadAdminProducts();
}

/* ================= LOAD ADMIN PRODUCTS ================= */
async function loadAdminProducts() {
  const res = await fetch(`${API}/products`);
  const products = await res.json();

  const list = document.getElementById("admin-product-list");
  if (!list) return;

  list.innerHTML = "";

  products.forEach(p => {
    list.innerHTML += `
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

/* ================= GO EDIT PAGE ================= */
function goEdit(id) {
  window.location.href = `admin-edit.html?id=${id}`;
}

/* ================= DELETE ================= */
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  await fetch(`${API}/products/${id}`, {
    method: "DELETE"
  });

  loadAdminProducts();
}

/* ================= EDIT PAGE LOGIC ================= */
const params = new URLSearchParams(window.location.search);
const editProductId = params.get("id");

if (editProductId) {
  loadEditProduct(editProductId);
}

async function loadEditProduct(id) {
  const res = await fetch(`${API}/products`);
  const products = await res.json();

  const product = products.find(p => p._id === id);
  if (!product) {
    alert("Product not found");
    return;
  }

  document.getElementById("editName").value = product.name;
  document.getElementById("editCategory").value = product.category;
  document.getElementById("editPrice").value = product.price;
  document.getElementById("editStock").value = product.stock;
}

async function saveEdit() {
  const formData = new FormData();

  formData.append("name", document.getElementById("editName").value);
  formData.append("category", document.getElementById("editCategory").value);
  formData.append("price", document.getElementById("editPrice").value);
  formData.append("stock", document.getElementById("editStock").value);

  const image = document.getElementById("editImage").files[0];
  if (image) {
    formData.append("image", image);
  }

  const res = await fetch(`${API}/products/${editProductId}`, {
    method: "PUT",
    body: formData
  });

  if (!res.ok) {
    alert("Update failed");
    return;
  }

  alert("Updated");
  window.location.href = "admin.html";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("admin-product-list")) {
    loadAdminProducts();
  }
});
/* ================= SHOP ================= */
async function loadProducts() {
  const res = await fetch(PRODUCT_API);
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
function searchAdmin() {
  const input = document.getElementById("admin-search");
  adminSearchKeyword = input ? input.value.toLowerCase() : "";
  renderAdminProducts();
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



function searchProducts() {
  const k = document.getElementById("search-input").value.toLowerCase();
  renderProducts(products.filter(p => p.name.toLowerCase().includes(k)));
}
function filterByCategory(cat) {
  if (cat === "All") {
    renderProducts(products);
  } else {
    renderProducts(products.filter(p => p.category === cat));
  }
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

// ===== IMAGE MODAL =====
const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const modalCaption = document.getElementById("modalCaption");

/* ================= ADMIN ================= */
async function loadAdminProducts() {
  const res = await fetch(`${API}/products`);
  adminProducts = await res.json();


  const tbody = document.getElementById("admin-product-list");

  tbody.innerHTML = "";

  renderAdminProducts();
}
function deleteProduct(id) {
  openConfirm("Delete this product?", async () => {

    const res = await fetch(`${API}/products/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      showToast("Delete failed");
      return;
    }

    showToast("Product deleted");
    loadAdminProducts(); // รีโหลดตาราง
  });
}


function openEditById(id) {
  // 🔑 ผูก element ตอนใช้งานจริง (กัน null)
  const editModal    = document.getElementById("editModal");
  const editId       = document.getElementById("editId");
  const editName     = document.getElementById("editName");
  const editCategory = document.getElementById("editCategory");
  const editPrice    = document.getElementById("editPrice");
  const editStock    = document.getElementById("editStock");
  const editImage    = document.getElementById("editImage");

  if (!editModal || !editId || !editName || !editCategory || !editPrice || !editStock) {
    alert("Edit modal element not found");
    return;
  }

  const product = adminProducts.find(p => p._id === id);
  if (!product) {
    alert("Product not found");
    return;
  }

  editModal.style.display = "flex";
  editId.value       = product._id;
  editName.value     = product.name;
  editCategory.value = product.category;
  editPrice.value    = product.price;
  editStock.value    = product.stock;
  editImage.value    = ""; // reset file
}


async function saveEdit() {
  if (!editId || !editName || !editCategory || !editPrice || !editStock) {
    alert("Edit form not ready");
    return;
  }

  const formData = new FormData();
  formData.append("name", editName.value.trim());
  formData.append("category", editCategory.value);
  formData.append("price", editPrice.value);
  formData.append("stock", editStock.value);

  if (editImage.files[0]) {
    formData.append("image", editImage.files[0]);
  }

  const res = await fetch(`/products/${editId.value}`, {
    method: "PUT",
    body: formData
  });

  if (!res.ok) {
    alert("Update failed");
    return;
  }

  closeEdit();
  loadAdminProducts();
}

function closeEdit() {
  editModal.style.display = "none";
}
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

let confirmCallback = null;

function openConfirm(message, onYes) {
  confirmCallback = onYes;
  document.getElementById("confirmMessage").innerText = message;
  document.getElementById("confirmModal").classList.add("show");
}

function closeConfirm() {
  document.getElementById("confirmModal").classList.remove("show");
  confirmCallback = null;
}

const confirmYesBtn = document.getElementById("confirmYes");
if (confirmYesBtn) {
  confirmYesBtn.onclick = () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  };
}

function filterAdmin(category) {
  adminCurrentCategory = category;

  // active button
  document.querySelectorAll(".admin-filter button").forEach(btn => {
    btn.classList.remove("active");

    if (
      btn.textContent === category ||
      (category === "all" && btn.textContent === "All")
    ) {
      btn.classList.add("active");
    }
  });

  renderAdminProducts();
}
function renderAdminProducts() {
  const tbody = document.getElementById("admin-product-list");
  if (!tbody) return;

  tbody.innerHTML = "";

  adminProducts
    .filter(p => {
      const keyword = adminSearchKeyword;

      return (
        // filter หมวดจากปุ่ม
        (adminCurrentCategory === "all" || p.category === adminCurrentCategory)
        &&
        // 🔍 search: ชื่อสินค้า OR หมวด
        (
          p.name.toLowerCase().includes(keyword) ||
          p.category.toLowerCase().includes(keyword)
        )
      );
    })
    .forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td><img src="${p.image}" width="60"></td>
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>${p.price}</td>
          <td>${p.stock}</td>
          <td>
            <button class="btn-edit" onclick="openEditById('${p._id}')">Edit</button>
            <button class="btn-delete" onclick="deleteProduct('${p._id}')">Delete</button>
          </td>
        </tr>
      `;
    });
}




const img = document.getElementById("modalImg");
// ===== IMAGE DRAG STATE =====
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// ===== DRAG EVENTS =====
modalImg.addEventListener("mousedown", e => {
  if (!modalImg.classList.contains("zoomed")) return;
  isDragging = true;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
});

document.addEventListener("mousemove", e => {
  if (!isDragging) return;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  modalImg.style.transform = `scale(2) translate(${currentX}px, ${currentY}px)`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

/* ================= CHECKOUT ================= */

const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderData = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      cart: JSON.parse(localStorage.getItem("cart")) || []
    };

    try {
      const res = await fetch(`${API}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("cart");
        window.location.href = "success.html";
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch (err) {
      alert("Server error");
      console.error(err);
    }
  });
} 
