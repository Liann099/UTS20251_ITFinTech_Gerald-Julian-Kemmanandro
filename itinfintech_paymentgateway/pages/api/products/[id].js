// pages/api/products/[id].js
import dbConnect from '../../../lib/mongoose'; // Adjust path as needed
import Product from '../../../models/Product'; // Adjust path as needed

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'PUT':
      try {
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
          new: true, 
          runValidators: true, 
        });
        if (!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(updatedProduct);
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({ message: 'Error updating product', error: error.message });
      }
      break;
    case 'DELETE':
      try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.status(204).json({ message: 'Product deleted successfully' });
      } catch (error) {
        console.error('Error deleting product:', error);
        res.status(400).json({ message: 'Error deleting product', error: error.message });
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}