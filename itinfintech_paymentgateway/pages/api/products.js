// pages/api/products.js
import dbConnect from '../../lib/mongoose';
import Product from '../../models/Product';

export default async function handler(req, res) {
  // --- Add this line for debugging ---
  console.log('DEBUG: MONGODB_URI IS:', process.env.MONGODB_URI);
  // ------------------------------------

  await dbConnect();

  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}