/* ================= IMPORT ================= */
require("dotenv").config({ path: __dirname + "/.env" });
console.log("MONGO_URI =", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Product = require("./models/Product");

/* ================= INIT APP ================= */
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

// static images
app.use("/images", express.static(path.join(__dirname, "images")));

// static frontend
app.use(express.static(path.join(__dirname, "frontend")));

/* ================= MongoDB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(err => console.error(err));
/* ================= API ================= */

// GET all products
app.get("/products", async (req, res) => {
  try {
    const { category } = req.query;
    const filter =
      category && category !== "all"
        ? { category }
        : {};

    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET product by id
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch {
    res.status(400).json({ message: "Invalid ID" });
  }
});

// POST add product
app.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST checkout (ลด stock)
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

// PUT update product
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

// DELETE product
app.delete("/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

