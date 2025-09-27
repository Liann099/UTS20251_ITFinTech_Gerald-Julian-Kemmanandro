import mongoose from 'mongoose';
import Order from '../../models/Order';

// Connect to MongoDB if not already connected
if (!mongoose.connections[0].readyState) {
  mongoose.connect(process.env.MONGODB_URI);
}

export default async function handler(req, res) {
  // Log semua request yang masuk untuk debugging
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Raw Body:', JSON.stringify(req.body, null, 2));
  console.log('=== WEBHOOK DEBUG END ===');

  if (req.method !== 'POST') {
    console.log('❌ Method not POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Check if webhook data exists
    if (!webhookData || Object.keys(webhookData).length === 0) {
      console.log('❌ Empty webhook data received');
      return res.status(400).json({ message: 'Empty webhook data' });
    }

    console.log('✅ Webhook received:', JSON.stringify(webhookData, null, 2));

    // COMMENT OUT webhook token validation for now to test
    // Uncomment this after confirming webhooks are working
    /*
    const callbackToken = req.headers['x-callback-token'];
    if (callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.log('❌ Invalid webhook token:', callbackToken);
      console.log('Expected:', process.env.XENDIT_WEBHOOK_TOKEN);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    */

    // Extract data from webhook
    const {
      id,
      external_id,
      status,
      paid_amount,
      paid_at,
      payment_method,
      payment_channel,
      payment_destination
    } = webhookData;

    console.log('📋 Extracted webhook data:');
    console.log('- ID:', id);
    console.log('- External ID:', external_id);
    console.log('- Status:', status);
    console.log('- Paid Amount:', paid_amount);
    console.log('- Paid At:', paid_at);

    // Validate required fields
    if (!external_id) {
      console.log('❌ No external_id in webhook data');
      return res.status(400).json({ message: 'external_id is required' });
    }

    if (!status) {
      console.log('❌ No status in webhook data');
      return res.status(400).json({ message: 'status is required' });
    }

    console.log(`🔍 Processing webhook for invoice: ${external_id}, status: ${status}`);

    // Find order by external_id
    const order = await Order.findOne({ external_id: external_id });
    
    if (!order) {
      console.log(`❌ Order not found for external_id: ${external_id}`);
      
      // List all orders to see what we have
      const allOrders = await Order.find({}, 'external_id status').limit(10);
      console.log('📋 Available orders in DB:', allOrders);
      
      return res.status(404).json({ 
        message: 'Order not found',
        external_id_received: external_id,
        available_orders: allOrders.map(o => o.external_id)
      });
    }

    console.log('✅ Found order:', {
      _id: order._id,
      external_id: order.external_id,
      current_status: order.status,
      amount: order.amount
    });

    // Update order status based on webhook event
    let updateData = {
      status: status.toUpperCase(),
      updated_at: new Date()
    };

    // If payment is successful
    if (status.toLowerCase() === 'paid' || status.toUpperCase() === 'PAID') {
      updateData = {
        ...updateData,
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        paid_amount: paid_amount || order.amount,
        payment_method: payment_method,
        payment_channel: payment_channel,
        payment_destination: payment_destination
      };
      
      console.log(`💰 Payment successful for order: ${external_id}`);
      console.log('💰 Payment details:', updateData);
    }

    console.log('🔄 Updating order with data:', updateData);

    // Update order in database
    const updatedOrder = await Order.findOneAndUpdate(
      { external_id: external_id },
      updateData,
      { new: true }
    );

    if (!updatedOrder) {
      console.log('❌ Failed to update order');
      return res.status(500).json({ message: 'Failed to update order' });
    }

    console.log(`✅ Order updated successfully: ${external_id}`);
    console.log('✅ New status:', updatedOrder.status);
    console.log('✅ Updated order:', {
      _id: updatedOrder._id,
      external_id: updatedOrder.external_id,
      status: updatedOrder.status,
      paid_amount: updatedOrder.paid_amount,
      paid_at: updatedOrder.paid_at
    });

    // Return success response to Xendit
    const response = {
      message: 'Webhook processed successfully',
      order_id: updatedOrder._id,
      external_id: updatedOrder.external_id,
      old_status: order.status,
      new_status: updatedOrder.status,
      processed_at: new Date().toISOString()
    };

    console.log('📤 Sending response to Xendit:', response);

    res.status(200).json(response);

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    console.error('💥 Error stack:', error.stack);
    
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}