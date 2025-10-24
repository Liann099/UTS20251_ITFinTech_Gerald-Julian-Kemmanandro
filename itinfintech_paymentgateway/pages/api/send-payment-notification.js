
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const twilio = require('twilio');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// 🔹 MongoDB Connection (equivalent to your dbConnect)
const dbConnect = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  }
};

// 🔹 Order Model (simplified – adjust based on your actual schema)
const orderSchema = new mongoose.Schema({}, { strict: false }); // or define your real schema
const Order = mongoose.model('Order', orderSchema);

// 🔹 WhatsApp Route (equivalent to your Next.js API route)
app.post('/api/sendWhatsapp', async (req, res) => {
  try {
    await dbConnect();

    const { orderId, phone, customerName, totalAmount, orderNumber } = req.body;

    // 🔹 Input validation
    if (!phone) {
      return res.status(400).json({ error: 'Nomor WhatsApp wajib diisi' });
    }

    if (!customerName || !totalAmount || !orderNumber) {
      return res.status(400).json({
        error: 'customerName, totalAmount, dan orderNumber wajib diisi',
      });
    }

    console.log('\n========== SEND PAYMENT WHATSAPP WITH TEMPLATE ==========');
    console.log('Phone:', phone);
    console.log('Customer:', customerName);
    console.log('Amount:', totalAmount);
    console.log('Order:', orderNumber);

    // 🔹 Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
    const templateSid = process.env.TWILIO_TEMPLATE_SID;

    console.log('\nChecking credentials:');
    console.log('- Account SID:', accountSid ? '✅ YES' : '❌ NO');
    console.log('- Auth Token:', authToken ? '✅ YES' : '❌ NO');
    console.log('- WhatsApp From:', whatsappFrom ? '✅ YES' : '❌ NO');
    console.log('- Template SID:', templateSid ? '✅ YES' : '❌ NO');

    if (!accountSid || !authToken || !whatsappFrom || !templateSid) {
      throw new Error('Missing Twilio credentials in environment variables');
    }

    const client = twilio(accountSid, authToken);

    // 🔹 Format phone to international (Indonesia: 62)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('62')) {
      formattedPhone = formattedPhone.startsWith('0')
        ? '62' + formattedPhone.slice(1)
        : '62' + formattedPhone;
    }
    const toNumber = `whatsapp:+${formattedPhone}`;

    console.log('\nPhone formatting:');
    console.log('- Original:', phone);
    console.log('- Formatted:', toNumber);
    console.log('- From:', whatsappFrom);

    // 🔹 Format amount as Rupiah
    const amountNum = typeof totalAmount === 'number' 
      ? totalAmount 
      : Number(totalAmount);
    const formattedAmount = `Rp${amountNum.toLocaleString('id-ID')}`;

    // 🔹 Template variables
    const contentVars = {
      customer_name: customerName,
      amount: formattedAmount,
      order_number: orderNumber,
    };

    console.log('\nSending with template...');
    console.log('- Template SID:', templateSid);
    console.log('- Variables:', JSON.stringify(contentVars));

    // 🔹 Send WhatsApp via Twilio
    const message = await client.messages.create({
      from: whatsappFrom,
      to: toNumber,
      contentSid: templateSid,
      contentVariables: JSON.stringify(contentVars),
    });

    console.log('\n✅ SUCCESS - Message sent!');
    console.log('- SID:', message.sid);
    console.log('- Status:', message.status);
    console.log('- To:', message.to);
    console.log('========== END ==========\n');

    return res.status(200).json({
      success: true,
      message: 'WhatsApp sent successfully',
      messageSid: message.sid,
      status: message.status,
    });

  } catch (err) {
    const error = err;

    console.log('\n❌ ERROR OCCURRED:');
    console.log('- Message:', error.message);
    console.log('- Code:', error.code);
    console.log('- Status:', error.status);
    if (error.moreInfo) {
      console.log('- More Info:', error.moreInfo);
    }
    console.log('========== END ==========\n');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp',
      code: error.code,
    });
  }
});

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});