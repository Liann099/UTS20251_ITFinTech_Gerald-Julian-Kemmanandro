// pages/api/webhook/xendit.js
import dbConnect from '../../lib/mongoose'; // Adjust path as needed
import Order from '../../models/Order'; // Adjust path as needed

// It's good practice to connect once per deployment if possible,
// but ensuring connection on each request is also safe.
// The lib/mongoose.js utility handles caching.
// await dbConnect(); // Can be called at the top or inside the handler

export default async function handler(req, res) {
  // --- 1. Basic Request Logging (for debugging) ---
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  // Avoid logging the raw body directly unless necessary for debugging,
  // as it might contain sensitive information.
  // console.log('Raw Body (stringified):', JSON.stringify(req.body, null, 2));
  console.log('=== WEBHOOK DEBUG END ===');

  // --- 2. Validate HTTP Method ---
  if (req.method !== 'POST') {
    console.warn(`❌ Method ${req.method} not allowed for Xendit webhook`);
    return res.status(405).json({ message: 'Method not allowed. Only POST is accepted for Xendit webhooks.' });
  }

  // --- 3. Connect to MongoDB ---
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');
  } catch (connectError) {
    console.error('💥 Error connecting to MongoDB:', connectError);
    // If database connection fails, we cannot process the webhook correctly.
    // Return a 500 error to indicate server issue. Xendit may retry.
    return res.status(500).json({ message: 'Internal server error - Database connection failed', error: connectError.message });
  }

  // --- 4. Process Webhook Data ---
  try {
    // Xendit typically sends JSON payload
    const webhookData = req.body;

    // --- 4a. Validate Webhook Payload Exists ---
    if (!webhookData || Object.keys(webhookData).length === 0) {
      console.warn('❌ Empty or invalid webhook data received');
      return res.status(400).json({ message: 'Empty or invalid webhook data received' });
    }

    console.log('✅ Webhook data received:', JSON.stringify(webhookData, null, 2));

    // --- 4b. Extract Essential Fields ---
    // Crucial fields from Xendit (names might vary slightly based on event type)
    const {
      id,                 // Internal Xendit ID
      external_id,        // Your order/invoice identifier (must match Order.external_id)
      status,             // Payment status (e.g., 'PAID', 'SETTLED', 'EXPIRED')
      paid_amount,        // Amount paid
      paid_at,            // Timestamp of payment
      payment_method,     // Payment method used
      payment_channel,   // Specific channel (e.g., BCA, OVO)
      payment_destination, // Destination account details
      // Include any other relevant fields you want to store
    } = webhookData;

    // --- 4c. Validate Required Fields ---
    if (!external_id) {
      console.error('❌ Missing external_id in webhook data');
      return res.status(400).json({ message: 'Missing required field: external_id' });
    }

    if (!status) {
      console.error('❌ Missing status in webhook data');
      return res.status(400).json({ message: 'Missing required field: status' });
    }

    console.log(`🔍 Processing webhook for external_id: ${external_id}, status: ${status}`);

    // --- 5. Find Corresponding Order in Database ---
    let order = null;
    try {
      // Find order by the external_id you sent to Xendit when creating the invoice
      order = await Order.findOne({ external_id: external_id });
    } catch (findError) {
      console.error(`💥 Error finding order with external_id ${external_id}:`, findError);
      // Return 500 to indicate server issue, prompting Xendit to retry
      return res.status(500).json({ message: 'Internal server error - Failed to find order', error: findError.message });
    }

    if (!order) {
      console.warn(`❌ Order not found for external_id: ${external_id}`);
      // List existing external_ids for debugging (optional, remove in production)
      try {
        const allOrders = await Order.find({}, 'external_id status').limit(10);
        console.log('📋 Sample of existing orders:', allOrders.map(o => ({ id: o._id, ext_id: o.external_id, status: o.status })));
      } catch (listError) {
        console.error('Error listing sample orders for debugging:', listError);
      }
      // Return 404 - Order not found. Xendit might retry, but it's likely a misconfiguration.
      return res.status(404).json({
        message: 'Order not found for the provided external_id',
        received_external_id: external_id,
        // hint: 'Check if external_id was correctly set when creating the Xendit invoice.'
      });
    }

    console.log('✅ Found order:', {
      _id: order._id,
      external_id: order.external_id,
      current_status: order.status,
      amount: order.amount // Assuming you have an 'amount' field
    });

    // --- 6. Prepare Update Data Based on Webhook Event ---
    let updateData = {
      updated_at: new Date(), // Always update the timestamp
      // Map Xendit's status to your internal status if needed
      // Example: Xendit sends 'PAID', you store 'paid off'
      status: status.toUpperCase(), // Or map based on logic below
    };

    // --- 6a. Handle Successful Payment ---
    // Adjust the status check based on actual values Xendit sends (e.g., 'PAID', 'SETTLED')
    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === 'PAID' || normalizedStatus === 'SETTLED') {
      console.log(`💰 Payment successful for order: ${external_id}`);
      updateData = {
        ...updateData,
        status: 'paid', // Your internal success status
        paid_at: paid_at ? new Date(paid_at) : new Date(), // Parse date if provided
        paid_amount: paid_amount !== undefined ? paid_amount : order.amount, // Use paid amount or fallback
        payment_method,
        payment_channel,
        payment_destination,
        // Add any other payment-specific fields you want to capture
      };
    }
    // --- 6b. Handle Other Statuses (Optional) ---
    // You might want to handle 'EXPIRED', 'FAILED' etc.
    else if (normalizedStatus === 'EXPIRED') {
         updateData.status = 'expired';
         console.log(`🕒 Payment expired for order: ${external_id}`);
    } else if (normalizedStatus === 'FAILED') {
         updateData.status = 'failed';
         console.log(`❌ Payment failed for order: ${external_id}`);
    }
    // Add more conditions as needed


    console.log('🔄 Preparing to update order with data:', JSON.stringify(updateData, null, 2));

    // --- 7. Update Order in Database ---
    let updatedOrder = null;
    try {
      // Use findOneAndUpdate for atomicity and to get the updated document back
      updatedOrder = await Order.findOneAndUpdate(
        { external_id: external_id }, // Filter by external_id
        { $set: updateData },          // Apply the updates
        { new: true, runValidators: true } // Options: return updated doc, run schema validators
      );

      if (!updatedOrder) {
        // This case is unlikely if the order was found earlier, but good to check
        console.error('❌ Failed to update order (findOneAndUpdate returned null)');
        return res.status(500).json({ message: 'Failed to update order - Unexpected error' });
      }

    } catch (updateError) {
      console.error(`💥 Error updating order ${order._id} (${external_id}):`, updateError);
      // Return 500 - Database update failed. Xendit may retry.
      return res.status(500).json({ message: 'Internal server error - Failed to update order', error: updateError.message });
    }

    console.log(`✅ Order updated successfully: ${external_id}`);
    console.log('✅ New status:', updatedOrder.status);
    console.log('✅ Updated order snapshot:', {
      _id: updatedOrder._id,
      external_id: updatedOrder.external_id,
      status: updatedOrder.status,
      paid_amount: updatedOrder.paid_amount,
      paid_at: updatedOrder.paid_at?.toISOString(), // Log in ISO format
      // ... other relevant updated fields
    });

    // --- 8. Send Success Response to Xendit ---
    // It's crucial to send a 2xx response so Xendit knows the webhook was received successfully.
    // Any non-2xx response signals Xendit to retry the webhook (based on their retry policy).
    const successResponse = {
      message: 'Webhook processed successfully',
      order_id: updatedOrder._id.toString(), // Convert ObjectId to string
      external_id: updatedOrder.external_id,
      old_status: order.status,
      new_status: updatedOrder.status,
      processed_at: new Date().toISOString(),
    };

    console.log('📤 Sending 200 OK response to Xendit:', successResponse);
    res.status(200).json(successResponse); // Send JSON response

  } catch (error) {
    // --- 9. Global Error Handling ---
    console.error('💥 UNHANDLED WEBHOOK PROCESSING ERROR:', error);
    console.error('💥 Error stack:', error.stack);

    // For unexpected errors, return a 500 to signal Xendit to retry.
    // Include minimal error info in the response.
    res.status(500).json({
      message: 'Internal server error during webhook processing',
      // error: error.message, // Consider omitting detailed error messages in production responses
      timestamp: new Date().toISOString(),
    });
  }
}