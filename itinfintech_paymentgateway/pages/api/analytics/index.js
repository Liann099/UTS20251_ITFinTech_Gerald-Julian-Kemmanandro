// pages/api/analytics/index.js
import dbConnect from '../../../lib/mongoose';
import Order from '../../../models/Order';

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        console.log('=== ANALYTICS DEBUG START ===');

        // --- Summary Statistics ---
        const totalOrders = await Order.countDocuments({});
        const pendingOrders = await Order.countDocuments({ status: 'PENDING' });
        const completedOrders = await Order.countDocuments({ status: 'PAID' });

        console.log('Total Orders:', totalOrders);
        console.log('Pending Orders:', pendingOrders);
        console.log('Completed Orders:', completedOrders);

        // --- Total Revenue Calculation ---
        const totalRevenueResult = await Order.aggregate([
          {
            $match: { status: 'PAID' }
          },
          {
            $addFields: {
              paid_amount_num: {
                $cond: {
                  if: { $isNumber: '$paid_amount' },
                  then: '$paid_amount',
                  else: { $toDouble: '$paid_amount' }
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$paid_amount_num' }
            }
          }
        ]);

        const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
        console.log('Total Revenue:', totalRevenue);

        // --- Turnover Chart Data ---
        const groupBy = req.query.groupBy || 'day';
        const dateFormatString = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

        // Fix: Normalize date field (convert string to date if needed)
        const turnoverData = await Order.aggregate([
          {
            $match: {
              status: 'PAID'
            }
          },
          {
            $addFields: {
              effectiveDate: {
                $cond: [
                  { $eq: [{ $type: '$paid_at' }, 'date'] },
                  '$paid_at',
                  {
                    $cond: [
                      { $eq: [{ $type: '$paid_at' }, 'string'] },
                      { $toDate: '$paid_at' },
                      '$created_at'
                    ]
                  }
                ]
              },
              paid_amount_num: {
                $cond: {
                  if: { $isNumber: '$paid_amount' },
                  then: '$paid_amount',
                  else: { $toDouble: '$paid_amount' }
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
              _id: { $dateToString: { format: dateFormatString, date: '$effectiveDate' } },
              totalAmount: { $sum: '$paid_amount_num' }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        console.log('Raw Turnover Data:', turnoverData);

        const formattedTurnoverData = turnoverData.map(item => ({
          date: item._id,
          amount: item.totalAmount || 0
        }));

        console.log('Formatted Turnover Data:', formattedTurnoverData);
        console.log('=== ANALYTICS DEBUG END ===');

        res.status(200).json({
          summary: {
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue
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
