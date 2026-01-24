console.log("🔥 SERVER VERSION: LOCAL UPLOAD 🔥");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const Product = require("./models/Product");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= STATIC FRONTEND ================= */
app.use(express.static(path.join(__dirname, "public")));

/* ================= STATIC UPLOADS ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= MULTER (LOCAL STORAGE) ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= MongoDB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.error("MongoDB Error:", err));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

/* ADD product (LOCAL UPLOAD) */
app.post("/products", upload.single("image"), async (req, res) => {
  try {
    console.log("=== ADD PRODUCT ===");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      image: `/uploads/${req.file.filename}` // ⭐ local image path
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("ADD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* EDIT product */
app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      stock: Number(req.body.stock)
    };

    // ✅ ถ้าเลือกไฟล์ใหม่ ค่อยอัปเดตรูป
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("EDIT ERROR:", err.message);
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

/* ================= CHECKOUT (REDUCE STOCK) ================= */
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

    res.json({ message: "Checkout success" });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
