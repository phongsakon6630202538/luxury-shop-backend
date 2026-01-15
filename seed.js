require("dotenv").config({ path: __dirname + "/.env" });

const mongoose = require("mongoose");
const Product = require("./models/Product");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB Atlas");

    // ล้างข้อมูลเก่า
    await Product.deleteMany({});

    const products = [
      {
        name: "Classic Luxury Shirt",
        price: 2990,
        image: "/images/shirt/shirt1.jpg",
        description: "Premium cotton white shirt",
        stock: 15,
        category: "Shirts"
      },
      {
        name: "Dark Luxury Shirt",
        price: 3200,
        image: "/images/shirt/shirt2.jpg",
        description: "Slim fit black luxury shirt",
        stock: 10,
        category: "Shirts"
      },
      {
        name: "Ocean Blue Shirt",
        price: 2500,
        image: "/images/shirt/shirt3.jpg",
        description: "Soft linen blue shirt",
        stock: 8,
        category: "Shirts"
      }
    ];

    await Product.insertMany(products);
    console.log("Products added successfully!");

    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
