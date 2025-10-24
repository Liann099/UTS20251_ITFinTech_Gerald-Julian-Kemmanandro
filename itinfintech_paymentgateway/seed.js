import mongoose from "mongoose";
import Product from "./models/Product.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
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
      { name: "20mm x 20M Industrial Tape", category: "Industrial", price: 20000},
      { name: "15mm x 15M Black tape", category: "Hard", price: 9000 },
      { name: "10mm x 30M Clear Tape", category: "Clear", price: 15000 },
      { name: "5mm x 10M Clear Tape", category: "Clear", price: 12000 },
      { name: "10mm x 25M Yellow Tape", category: "Paper", price: 25000 },
      // LAGII! TAMBAH LAGII!
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