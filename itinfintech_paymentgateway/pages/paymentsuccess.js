// pages/paymentsuccess.js
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <Head>
        <title>Payment Success</title>
      </Head>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}>Payment Successful!</h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>Thank you for your purchase. Your order has been confirmed.</p>
      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Order Summary</h2>
        {/* Placeholder for order details */}
        <p>Order ID: [Insert Order ID]</p>
        <p>Total Amount: Rp. [Insert Total]</p>
        <p>Shipping Address: [Insert Address]</p>
      </div>
      <button 
        onClick={() => router.push('/')}
        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Back to Home
      </button>
    </div>
  );
}