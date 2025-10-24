// pages/api/create-payment.js
import { Xendit } from 'xendit-node';
import dbConnect from '../../lib/mongoose';
import Order from '../../models/Order';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config({ path: '.env.local' });

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { total, items, customer_name, customer_email, customer_phone } = req.body;

  // Validate required fields
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    console.error('❌ Invalid email format:', customer_email);
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!customer_phone || typeof customer_phone !== 'string') {
    console.error('❌ Phone number required for WhatsApp notification');
    return res.status(400).json({ error: 'Phone number is required' });
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
      customer_phone: customer_phone.trim(),
    });

    const invoiceData = {
      externalId: externalId,
      amount: Math.round(total),
      payerEmail: customer_email.trim().toLowerCase(),
      description: `Payment for ${items.length} item(s) from DAIKO Store`,
      invoiceDuration: 86400,
      currency: 'IDR',
      reminderTime: 1,
      successRedirectUrl: successRedirectUrl,
      failureRedirectUrl: successRedirectUrl,
    };

    if (customer_name && customer_name.trim()) {
      invoiceData.customer = {
        givenNames: customer_name.trim(),
        email: customer_email.trim().toLowerCase(),
      };
      if (customer_phone) {
        invoiceData.customer.mobileNumber = customer_phone.trim();
      }
    }

    if (items && items.length > 0) {
      invoiceData.items = items.map((item) => ({
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

    const invoiceUrl = invoice.invoiceUrl || invoice.invoice_url;

    const newOrder = await Order.create({
      external_id: externalId,
      amount: total,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      status: 'pending',
      customer_name: customer_name || 'Customer',
      customer_email: customer_email.trim().toLowerCase(),
      customer_phone: customer_phone || null,
      xendit_invoice_url: invoiceUrl,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('✅ Order created:', newOrder._id);
    console.log('✅ Invoice URL:', invoiceUrl);

    // 📲 SEND WHATSAPP NOTIFICATION VIA TWILIO
    if (customer_phone && invoiceUrl) {
      try {
        // Format phone to 62... (Indonesian international format)
        let cleanPhone = customer_phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.slice(1);
        } else if (!cleanPhone.startsWith('62')) {
          cleanPhone = '62' + cleanPhone;
        }

        console.log('📲 Preparing to send WhatsApp to:', `+${cleanPhone}`);

        // Prepare product summary
        // For multiple items, show first item + count, or single item name
        let productSummary = '';
        if (items.length === 1) {
          productSummary = items[0].name;
        } else {
          productSummary = `${items[0].name} + ${items.length - 1} item lainnya`;
        }

        // Template variables based on your Twilio template:
        // {{user_name}}, {{productName}}, {{Productprice}}, {{Payment_link}}
        const contentVariables = {
          user_name: customer_name || 'Customer',
          productName: productSummary,
          Productprice: `Rp ${total.toLocaleString('id-ID')}`,
          Payment_link: invoiceUrl,
        };

        console.log('📋 Content variables:', contentVariables);

        // Send template message with CORRECT SID
        const message = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
          to: `whatsapp:+${cleanPhone}`,
          contentSid: 'HX04ef89f34b843535ce22e6447917f7f9', // ✅ CORRECT TEMPLATE SID
          contentVariables: JSON.stringify(contentVariables),
        });

        console.log('✅ WhatsApp notification sent successfully!');
        console.log('📨 Message SID:', message.sid);
        console.log('📱 Sent to:', `+${cleanPhone}`);
      } catch (twilioErr) {
        console.error('⚠️ Failed to send WhatsApp:', twilioErr.message || twilioErr);
        console.error('⚠️ Twilio Error Details:', {
          code: twilioErr.code,
          moreInfo: twilioErr.moreInfo,
          status: twilioErr.status,
          details: twilioErr.detail
        });
        
        // Don't fail the entire request if WhatsApp fails
        console.error('⚠️ ⚠️ ⚠️ WHATSAPP NOTIFICATION FAILED ⚠️ ⚠️ ⚠️');
      }
    } else {
      console.log('⚠️ No customer phone or invoice URL, WhatsApp notification skipped.');
    }

    res.status(200).json({
      invoiceUrl: invoiceUrl,
      orderId: newOrder._id,
      externalId: externalId,
      whatsappSent: !!(customer_phone && invoiceUrl),
    });
  } catch (error) {
    console.error('💥 Xendit/Create Order Error:', error);
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
      details: error.errorCode || 'INTERNAL_ERROR',
    });
  }
}