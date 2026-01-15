const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String, // เก็บ path รูป หรือ URL
      required: true
    },
    description: {
      type: String
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },

  category: {
      type: String,
      required: true,
      // 🔥 เพิ่ม 'Hats' และ 'Accessories' ลงไปในวงเล็บนี้
      enum: ['Shirts', 'Pants', 'Bags', 'Shoes', 'Hats', 'Accessories'], 
      default: 'Shirts'
    }
    // -----------------------
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);