require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const Product = require("./models/Product");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= STATIC ================= */
// frontend
app.use(express.static(path.join(__dirname, "frontend")));

// uploads (images)
const uploadDir = path.join(__dirname, "uploads");

// ✅ สร้างโฟลเดอร์ uploads อัตโนมัติ ถ้ายังไม่มี
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use("/uploads", express.static(uploadDir));

/* ================= UPLOAD CONFIG ================= */
const upload = multer({
  dest: uploadDir
});

/* ================= MongoDB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.error(err));

/* ================= API ================= */

/* GET all products */
app.get("/products", async (req, res) => {
  try {
    const filter =
      req.query.category && req.query.category !== "all"
        ? { category: req.query.category }
        : {};

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET product by id */
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch {
    res.status(400).json({ message: "Invalid ID" });
  }
});

/* ================= ADD PRODUCT (UPLOAD IMAGE) ================= */
app.post("/products", upload.single("image"), async (req, res) => {
  try {
    // ✅ ป้องกัน error ถ้าไม่มีไฟล์
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      image: `/uploads/${req.file.filename}`
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* PUT update product (no image change) */
app.put("/products/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE product */
app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST checkout */
app.post("/checkout", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    for (const item of cart) {
      const product = await Product.findById(item.id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          error: `Not enough stock for ${product.name}`
        });
      }

      product.stock -= item.qty;
      await product.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
