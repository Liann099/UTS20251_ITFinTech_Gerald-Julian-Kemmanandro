// pages/api/orders/index.js
import dbConnect from '../../../lib/mongoose'; // Adjust path as needed
import Order from '../../../models/Order'; // Adjust path as needed

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Example: Fetch all orders, potentially with filters (status, date range, etc.)
        // You can add query parameters to filter results
        const { status, customer, limit, skip } = req.query;
        let query = {};

        if (status) query.status = status;
        if (customer) query.customer = new RegExp(customer, 'i'); // Case-insensitive search

        const orders = await Order.find(query)
          .limit(limit ? parseInt(limit) : 0) // 0 means no limit
          .skip(skip ? parseInt(skip) : 0);   // 0 means no skip

        res.status(200).json(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
    // Add POST if you allow creating orders via the admin panel
    // case 'POST': ...
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}