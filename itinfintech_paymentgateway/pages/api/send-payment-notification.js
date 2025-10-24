// pages/api/send-payment-notification.js
import dbConnect from '../../lib/mongoose';
import Order from '../../models/Order';
import { sendWhatsAppVerificationProduction } from '../../lib/twilio.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  try {
    await dbConnect();
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.customer_phone) {
      return res.status(400).json({ error: 'Customer phone number not available' });
    }

    const phone = order.customer_phone.startsWith('+')
      ? order.customer_phone
      : `+${order.customer_phone.replace(/\D/g, '')}`;

    const messageBody = `✅ Hello ${order.customer_name || 'Customer'}!\n\nYour order is being processed.\nOrder ID: ${order._id}\nTotal: Rp ${order.amount.toLocaleString()}\n\nPay here:\n${order.xendit_invoice_url}\n\nThank you for shopping with DAIKO! 🛍️`;

    await sendWhatsAppVerificationProduction(phone, messageBody);

    res.status(200).json({ success: true, message: 'Payment notification sent successfully' });
  } catch (error) {
    console.error('Error sending payment notification:', error);
    res.status(500).json({ error: 'Failed to send payment notification', details: error.message });
  }
}
