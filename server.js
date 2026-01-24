require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Product = require("./models/Product");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= STATIC FRONTEND ================= */
app.use(express.static(path.join(__dirname, "public")));

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================= MULTER → CLOUDINARY ================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "luxury-shop",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
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

/* ADD product */
app.post("/products", upload.single("image"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file); // 👈 สำคัญ

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      image: req.file.path
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("ADD ERROR:", err);
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

    if (req.file) updateData.image = req.file.path;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
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

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
app.post("/checkout", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 🔥 ลด stock ทีละสินค้า
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
    console.error("CHECKOUT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
