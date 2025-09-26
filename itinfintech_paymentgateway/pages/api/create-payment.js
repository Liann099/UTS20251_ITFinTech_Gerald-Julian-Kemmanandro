// pages/api/create-payment.js

import { Xendit } from 'xendit-node';

// Initialize Xendit with your secret key
const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

const { Invoice } = x;

export default async function handler(req, res) {
  // Pastikan request adalah POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { total, items } = req.body;

    // Buat external_id yang unik untuk setiap transaksi
    const externalID = `invoice-${Date.now()}`;
    
    const invoice = await Invoice.create({
      externalID: externalID,
      amount: total,
      payerEmail: 'customer@example.com', // Anda bisa minta email user di form
      description: `Payment for ${items.length} items`,
    });

    // Kirim kembali invoice URL ke frontend
    res.status(200).json({ invoiceUrl: invoice.invoiceUrl });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create payment invoice' });
  }
}