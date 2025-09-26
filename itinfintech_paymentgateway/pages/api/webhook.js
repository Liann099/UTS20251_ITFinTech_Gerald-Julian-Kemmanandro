export default async function handler(req, res) {
  // Pastikan request adalah POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verifikasi Callback Token dari Xendit
    const xenditCallbackToken = req.headers['x-callback-token'];
    
    // Ambil token verifikasi dari environment variable Anda
    const myCallbackToken = process.env.XENDIT_CALLBACK_TOKEN;

    if (xenditCallbackToken !== myCallbackToken) {
      console.log('Invalid callback token');
      return res.status(401).send('Invalid callback token');
    }

    // 2. Ambil data dari body request
    const eventData = req.body;
    console.log('Received Xendit Webhook:', eventData);

    // 3. Proses data event
    // Cek jika event adalah 'invoice.paid' atau 'payment.succeeded'
    if (eventData.event === 'payment.succeeded' || (eventData.status && eventData.status === 'PAID')) {
      const externalId = eventData.external_id;
      
      // TODO: Di sinilah Anda akan menulis logika untuk update database.
      // Contoh: await updateOrderStatus(externalId, 'LUNAS');
      console.log(`Order ${externalId} has been paid.`);
    }

    // Kirim respons 200 OK ke Xendit untuk menandakan webhook diterima
    res.status(200).send('Webhook received successfully.');

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}