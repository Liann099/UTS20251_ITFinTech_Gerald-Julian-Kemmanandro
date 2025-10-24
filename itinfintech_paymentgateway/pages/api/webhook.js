// pages/api/webhook.js
// ⚠️ IMPORTANT: Jika file Anda ada di /pages/api/webhook/xendit.js, 
// ganti nama file atau sesuaikan path import di bawah!

import dbConnect from '../../lib/mongoose'; // ✅ 2 level up untuk /pages/api/webhook.js
import Order from '../../models/Order';     // ✅ 2 level up untuk /pages/api/webhook.js
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper function to send WhatsApp notification
async function sendWhatsAppSuccessNotification(customerPhone, customerName, amount, orderNumber) {
  try {
    // Format phone to 62... (Indonesian international format)
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    console.log('📲 Preparing to send WhatsApp SUCCESS notification to:', `+${cleanPhone}`);

    // Template variables for payment success
    // Template: "Your payment with the total of {{amount}} for order {{order_number}} have successfully confirmed!"
    const contentVariables = {
      customer_name: customerName || 'Customer',
      amount: `Rp ${(amount || 0).toLocaleString('id-ID')}`,
      order_number: orderNumber,
    };

    console.log('📋 Content variables:', contentVariables);

    // Send template message with SUCCESS template
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: `whatsapp:+${cleanPhone}`,
      contentSid: 'HXddec6d2c2c0f25b0690a443fbabcc1f2', // ✅ Payment SUCCESS template
      contentVariables: JSON.stringify(contentVariables),
    });

    console.log('✅ WhatsApp SUCCESS notification sent!');
    console.log('📨 Message SID:', message.sid);
    console.log('📱 Sent to:', `+${cleanPhone}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send WhatsApp notification:', error.message);
    console.error('❌ Twilio Error Details:', {
      code: error.code,
      moreInfo: error.moreInfo,
      status: error.status,
      details: error.detail
    });
    return false;
  }
}

export default async function handler(req, res) {
  // --- 1. Basic Request Logging (for debugging) ---
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
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
    return res.status(500).json({ message: 'Internal server error - Database connection failed', error: connectError.message });
  }

  // --- 4. Process Webhook Data ---
  try {
    const webhookData = req.body;

    // --- 4a. Validate Webhook Payload Exists ---
    if (!webhookData || Object.keys(webhookData).length === 0) {
      console.warn('❌ Empty or invalid webhook data received');
      return res.status(400).json({ message: 'Empty or invalid webhook data received' });
    }

    console.log('✅ Webhook data received:', JSON.stringify(webhookData, null, 2));

    // --- 4b. Extract Essential Fields ---
    const {
      id,
      external_id,
      status,
      paid_amount,
      paid_at,
      payment_method,
      payment_channel,
      payment_destination,
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
      order = await Order.findOne({ external_id: external_id });
    } catch (findError) {
      console.error(`💥 Error finding order with external_id ${external_id}:`, findError);
      return res.status(500).json({ message: 'Internal server error - Failed to find order', error: findError.message });
    }

    if (!order) {
      console.warn(`❌ Order not found for external_id: ${external_id}`);
      try {
        const allOrders = await Order.find({}, 'external_id status').limit(10);
        console.log('📋 Sample of existing orders:', allOrders.map(o => ({ id: o._id, ext_id: o.external_id, status: o.status })));
      } catch (listError) {
        console.error('Error listing sample orders for debugging:', listError);
      }
      return res.status(404).json({
        message: 'Order not found for the provided external_id',
        received_external_id: external_id,
      });
    }

    console.log('✅ Found order:', {
      _id: order._id,
      external_id: order.external_id,
      current_status: order.status,
      amount: order.amount,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
    });

    // --- 6. Prepare Update Data Based on Webhook Event ---
    let updateData = {
      updated_at: new Date(),
      status: status.toUpperCase(),
    };

    // --- 6a. Handle Successful Payment ---
    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === 'PAID' || normalizedStatus === 'SETTLED') {
      console.log(`💰 Payment successful for order: ${external_id}`);
      updateData = {
        ...updateData,
        status: 'paid',
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        paid_amount: paid_amount !== undefined ? paid_amount : order.amount,
        payment_method,
        payment_channel,
        payment_destination,
      };

      // 📲 SEND WHATSAPP SUCCESS NOTIFICATION
      if (order.customer_phone) {
        console.log('📲 Attempting to send WhatsApp payment success notification...');
        try {
          const whatsappSent = await sendWhatsAppSuccessNotification(
            order.customer_phone,
            order.customer_name || 'Customer',
            paid_amount || order.amount,
            external_id
          );
          
          if (whatsappSent) {
            updateData.whatsapp_success_sent = true;
            updateData.whatsapp_success_sent_at = new Date();
            console.log('✅ WhatsApp notification marked as sent in order');
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp notification error:', whatsappError.message);
          // Don't fail the webhook if WhatsApp fails
          updateData.whatsapp_success_sent = false;
          updateData.whatsapp_error = whatsappError.message;
        }
      } else {
        console.log('⚠️ No customer phone number found for order:', external_id);
      }
    }
    // --- 6b. Handle Other Statuses ---
    else if (normalizedStatus === 'EXPIRED') {
      updateData.status = 'expired';
      console.log(`🕒 Payment expired for order: ${external_id}`);
    } else if (normalizedStatus === 'FAILED') {
      updateData.status = 'failed';
      console.log(`❌ Payment failed for order: ${external_id}`);
    }

    console.log('🔄 Preparing to update order with data:', JSON.stringify(updateData, null, 2));

    // --- 7. Update Order in Database ---
    let updatedOrder = null;
    try {
      updatedOrder = await Order.findOneAndUpdate(
        { external_id: external_id },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedOrder) {
        console.error('❌ Failed to update order (findOneAndUpdate returned null)');
        return res.status(500).json({ message: 'Failed to update order - Unexpected error' });
      }

    } catch (updateError) {
      console.error(`💥 Error updating order ${order._id} (${external_id}):`, updateError);
      return res.status(500).json({ message: 'Internal server error - Failed to update order', error: updateError.message });
    }

    console.log(`✅ Order updated successfully: ${external_id}`);
    console.log('✅ New status:', updatedOrder.status);
    console.log('✅ Updated order snapshot:', {
      _id: updatedOrder._id,
      external_id: updatedOrder.external_id,
      status: updatedOrder.status,
      paid_amount: updatedOrder.paid_amount,
      paid_at: updatedOrder.paid_at?.toISOString(),
      whatsapp_sent: updatedOrder.whatsapp_success_sent,
    });

    // --- 8. Send Success Response to Xendit ---
    const successResponse = {
      message: 'Webhook processed successfully',
      order_id: updatedOrder._id.toString(),
      external_id: updatedOrder.external_id,
      old_status: order.status,
      new_status: updatedOrder.status,
      whatsapp_notification_sent: updatedOrder.whatsapp_success_sent || false,
      processed_at: new Date().toISOString(),
    };

    console.log('📤 Sending 200 OK response to Xendit:', successResponse);
    res.status(200).json(successResponse);

  } catch (error) {
    // --- 9. Global Error Handling ---
    console.error('💥 UNHANDLED WEBHOOK PROCESSING ERROR:', error);
    console.error('💥 Error stack:', error.stack);

    res.status(500).json({
      message: 'Internal server error during webhook processing',
      timestamp: new Date().toISOString(),
    });
  }
}