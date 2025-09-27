export default function handler(req, res) {
    if (req.method === 'POST') {
      console.log('Webhook received:', req.body);
      return res.status(200).json({ message: 'Webhook received!' });
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  }