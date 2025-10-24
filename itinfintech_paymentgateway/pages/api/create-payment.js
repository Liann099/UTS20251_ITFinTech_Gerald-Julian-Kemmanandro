// pages/api/create-payment.js
import { Xendit } from 'xendit-node';
import dbConnect from '../../lib/mongoose';
import Order from '../../models/Order';
import dotenv from 'dotenv';
import client from '../../lib/twilio.js';

dotenv.config({ path: '.env.local' });

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { total, items, customer_name, customer_email, customer_phone } = req.body;

  // ✅ Validate required fields
  if (typeof total !== 'number' || total <= 0) {
    console.error('❌ Invalid total:', total);
    return res.status(400).json({ error: 'Invalid or missing total amount' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error('❌ Invalid items:', items);
    return res.status(400).json({ error: 'Items must be a non-empty array' });
  }

  if (!customer_email || typeof customer_email !== 'string') {
    console.error('❌ Invalid email:', customer_email);
    return res.status(400).json({ error: 'Valid customer email is required' });
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    console.error('❌ Invalid email format:', customer_email);
    return res.status(400).json({ error: 'Invalid email format' });
  }

  await dbConnect();

  try {
    const externalId = `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const successRedirectUrl = (
      process.env.NEXT_PUBLIC_SUCCESS_REDIRECT_URL || 
      'https://undebased-riverine-epifania.ngrok-free.dev/paymentsuccess'
    ).trim();

    console.log('📝 Creating invoice with data:', {
      external_id: externalId,
      amount: Math.round(total),
      customer_email: customer_email.trim().toLowerCase(),
      customer_name: customer_name || 'Customer',
    });

    // ✅ Proper Xendit Invoice structure
    const invoiceData = {
      externalId: externalId, // Note: camelCase for SDK
      amount: Math.round(total),
      payerEmail: customer_email.trim().toLowerCase(), // Note: camelCase
      description: `Payment for ${items.length} item(s) from DAIKO Store`,
      invoiceDuration: 86400, // 24 hours in seconds
      currency: 'IDR',
      reminderTime: 1,
      successRedirectUrl: successRedirectUrl,
      failureRedirectUrl: successRedirectUrl,
    };

    // Add customer details if name is provided
    if (customer_name && customer_name.trim()) {
      invoiceData.customer = {
        givenNames: customer_name.trim(),
        email: customer_email.trim().toLowerCase(),
      };
      
      if (customer_phone) {
        invoiceData.customer.mobileNumber = customer_phone.trim();
      }
    }

    // Add items if they have proper structure
    if (items && items.length > 0) {
      invoiceData.items = items.map(item => ({
        name: item.name || 'Product',
        quantity: item.quantity || 1,
        price: Math.round(item.price),
        category: 'Product',
      }));
    }

    console.log('🚀 Sending to Xendit:', JSON.stringify(invoiceData, null, 2));

    const invoice = await x.Invoice.createInvoice({
      data: invoiceData,
    });

    console.log('✅ Xendit response:', invoice);

    // ✅ Save order to database
    const newOrder = await Order.create({
      external_id: externalId,
      amount: total,
      items: items.map(item => ({
        productId: item._id || item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      status: 'pending', 
      customer_name: customer_name || 'Customer',
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone || null,
      xendit_invoice_url: invoice.invoiceUrl || invoice.invoice_url,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Order created:', newOrder._id);
    console.log('✅ Invoice URL:', invoice.invoiceUrl || invoice.invoice_url);

    // ✅ Send WhatsApp notification
    if (customer_phone) {
      try {
        const phoneNumber = customer_phone.startsWith('+') 
          ? customer_phone 
          : `+${customer_phone}`;
          
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${phoneNumber}`,
          body: `✅ Hello ${customer_name || 'Customer'}!\n\nYour order has been created.\nOrder ID: ${newOrder._id}\nTotal: Rp ${total.toLocaleString()}\n\nComplete payment here:\n${invoice.invoiceUrl || invoice.invoice_url}\n\nThank you for shopping with DAIKO! 🛍️`,
        });
        console.log('📲 WhatsApp message sent to', phoneNumber);
      } catch (err) {
        console.error('⚠️ WhatsApp send failed:', err.message);
      }
    } else {
      console.log('⚠️ No customer phone number provided, WhatsApp skipped.');
    }

    res.status(200).json({
      invoiceUrl: invoice.invoiceUrl || invoice.invoice_url,
      orderId: newOrder._id,
      externalId: externalId,
    });

  } catch (error) {
    console.error('💥 Xendit/Create Order Error:', error);
    
    // Log detailed error info
    if (error.response) {
      console.error('Error response:', error.response);
      console.error('Error data:', error.response.data);
    }
    
    if (error.errorCode) {
      console.error('Error code:', error.errorCode);
      console.error('Error message:', error.errorMessage);
    }

    res.status(500).json({ 
      error: 'Failed to create payment invoice',
      message: error.errorMessage || error.message,
      details: error.errorCode || 'INTERNAL_ERROR'
    });
  }
}