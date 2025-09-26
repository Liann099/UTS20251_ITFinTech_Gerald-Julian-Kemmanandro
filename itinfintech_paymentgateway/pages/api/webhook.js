import clientPromise from '../../lib/mongoose'; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const xenditCallbackToken = req.headers['x-callback-token'];
    const myCallbackToken = process.env.XENDIT_CALLBACK_TOKEN;

    if (xenditCallbackToken !== myCallbackToken) {
      return res.status(401).send('Invalid callback token');
    }
    const eventData = req.body;
    console.log('Received Xendit Webhook:', eventData);

    if (eventData.status && eventData.status === 'PAID') {
      const externalId = eventData.external_id;
      const client = await clientPromise;
      const db = client.db("my-shop-db");
      const result = await db.collection("orders").updateOne(
        { external_id: externalId }, 
        { $set: { status: 'LUNAS' } } 
      );
      if (result.modifiedCount > 0) {
        console.log(`Order ${externalId} status updated to LUNAS.`);
      } else {
        console.log(`No order found or status was already updated for ${externalId}.`);
      }
    }
    res.status(200).send('Webhook received successfully.');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}