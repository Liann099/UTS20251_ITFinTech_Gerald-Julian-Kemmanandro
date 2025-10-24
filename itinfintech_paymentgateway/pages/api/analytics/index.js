// pages/api/analytics/index.js
import dbConnect from '../../../lib/mongoose'; // Adjust path as needed
import Order from '../../../models/Order'; // Adjust path as needed

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // --- Summary Statistics ---
        const totalOrders = await Order.countDocuments({});
        const pendingOrders = await Order.countDocuments({ status: 'PENDING' }); // Adjust status string if needed
        const completedOrders = await Order.countDocuments({ status: 'PAID' }); // Adjust status string if needed

        // Calculate total revenue from paid orders
        const totalRevenueResult = await Order.aggregate([
          { $match: { status: 'PAID', paid_at: { $exists: true } } }, // Only sum paid orders
          { $group: { _id: null, totalRevenue: { $sum: '$paid_amount' } } } // Sum the paid_amount field
        ]);
        const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;


        // --- Turnover Chart Data ---
        // Determine grouping based on query parameter or default
        const groupBy = req.query.groupBy || 'day'; // Expect 'day' or 'month'
        let dateFormat;
        if (groupBy === 'month') {
            // Group by year-month (e.g., "2023-10")
            dateFormat = { $dateToString: { format: "%Y-%m", date: "$paid_at" } };
        } else {
            // Default to daily (e.g., "2023-10-27")
            dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$paid_at" } };
        }

       const turnoverData = await Order.aggregate([
  {
    $match: {
      status: 'PAID',
      paid_at: { $exists: true, $ne: null, $type: 'date' } // Only valid dates
    }
  },
  {
    $addFields: {
      // Ensure paid_at is a valid date (fallback to created_at if needed)
      effectiveDate: {
        $cond: {
          if: { $eq: [{ $type: "$paid_at" }, "date"] },
          then: "$paid_at",
          else: "$created_at"
        }
      }
    }
  },
  {
    $match: {
      effectiveDate: { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: dateFormat, // Your existing dateFormat logic using "$effectiveDate"
      totalAmount: { $sum: '$paid_amount' }
    }
  },
  { $sort: { _id: 1 } }
]);

        // Format turnover data for the frontend
        const formattedTurnoverData = turnoverData.map(item => ({
          date: item._id, // This will be "YYYY-MM-DD" or "YYYY-MM"
          amount: item.totalAmount
        }));

        // Send the aggregated data back to the frontend
        res.status(200).json({
          summary: {
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue
            // You can add more summary stats here if needed
          },
          turnover: formattedTurnoverData
        });

      } catch (error) {
        console.error('Error fetching analytics data:', error);
        res.status(500).json({ message: 'Failed to fetch analytics data', error: error.message });
      }
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}