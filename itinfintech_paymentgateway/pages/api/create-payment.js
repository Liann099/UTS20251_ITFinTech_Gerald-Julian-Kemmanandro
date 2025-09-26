// pages/api/create-payment.js
import { Xendit } from 'xendit-node';
import dbConnect from '../../lib/mongoose';
import Order from '../../models/Order';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  try {
    const { total, items } = req.body;
    const externalId = `invoice-${Date.now()}`;  
    const invoice = await x.Invoice.createInvoice({
      data: {
        externalId: externalId, 
        amount: Math.round(total),
        currency: 'IDR', 
        payerEmail: 'customer@example.com',
        description: `Payment for ${items.length} items`,
      },
    });
    await Order.create({
      external_id: externalId,  
      amount: total,
      items: items,
      status: 'PENDING',
    });
    res.status(200).json({ invoiceUrl: invoice.invoiceUrl });
  } catch (error) {
    console.error('FINAL XENDIT API ERROR:', error);
    res.status(500).json({ error: 'Failed to create payment invoice' });
  }
}