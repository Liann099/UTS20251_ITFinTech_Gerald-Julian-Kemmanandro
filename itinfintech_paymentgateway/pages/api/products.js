// pages/api/products.js
import dbConnect from '../../lib/mongoose';
import Product from '../../models/Product';

export default async function handler(req, res) {
  // Debug log for MONGODB_URI
  console.log('DEBUG: MONGODB_URI IS:', process.env.MONGODB_URI);
  
  // Connect to the database
  await dbConnect();

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Fetch all products from the database
        console.log('Fetching all products...');
        const products = await Product.find({});
        console.log(`Found ${products.length} products.`);
        res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error while fetching products', error: error.message });
      }
      break;

    case 'POST':
      try {
        // Extract data from the request body
        const { name, price, category, imageUrl } = req.body;

        console.log('Received data for new product:', { name, price, category, imageUrl });

        // Basic validation
        if (!name || price === undefined || price === null || isNaN(price) || !category) {
           console.warn('Validation failed for new product:', { name, price, category, imageUrl });
          return res.status(400).json({ message: 'Name, price, and category are required. Price must be a valid number.' });
        }

        // Create a new product instance
        const newProductData = {
          name,
          price: Number(price), // Ensure it's a number
          category,
          imageUrl: imageUrl || '/public' // Provide default if missing
        };

        console.log('Creating new product with data:', newProductData);

        // Save the new product to the database
        const product = new Product(newProductData);
        const savedProduct = await product.save();

        console.log('Product created successfully:', savedProduct._id);
        // Return the created product with 201 Created status
        res.status(201).json(savedProduct);

      } catch (error) {
        console.error('Error creating product:', error);
        // Mongoose validation errors
        if (error.name === 'ValidationError') {
          return res.status(400).json({ message: 'Validation Error', error: error.message });
        }
        // Other errors
        res.status(500).json({ message: 'Internal server error while creating product', error: error.message });
      }
      break;

    default:
      // Handle unsupported methods
      console.warn(`Method ${method} not allowed for /api/products`);
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}