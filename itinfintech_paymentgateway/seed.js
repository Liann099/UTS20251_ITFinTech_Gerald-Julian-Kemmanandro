import mongoose from "mongoose";
import Product from "./models/Product.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // 👈 tambahin path .env.local

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined. Check your .env.local file.");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await Product.deleteMany();

    const products = [
      { name: "Coca Cola", category: "Drinks", price: 2000},
      { name: "Sprite", category: "Drinks", price: 9000 },
      { name: "Potato Chips", category: "Snacks", price: 15000 },
      { name: "Chocolate Bar", category: "Snacks", price: 12000 },
      { name: "Burger", category: "Meals", price: 25000 },
      { name: "Fried Rice", category: "Meals", price: 30000 }
    ];

    await Product.insertMany(products);
    console.log("Seed data inserted");
  } catch (err) {
    console.error("Error seeding data:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

seed();