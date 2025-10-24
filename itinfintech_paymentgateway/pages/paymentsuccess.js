// pages/paymentsuccess.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentSuccess() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // The router.query might contain parameters sent by Xendit
    // depending on how you configured the redirect URL
    // e.g., if redirect URL is /payment-success?external_id=123
    const { external_id } = router.query; 

    if (external_id) {
      // Optionally, fetch order details from your backend
      // to show specific information to the user
      const fetchOrderDetails = async () => {
        try {
          const res = await fetch(`/api/orders/${external_id}`); // Example API route to get order
          if (res.ok) {
            const order = await res.json();
            setOrderInfo(order);
          } else {
            setError('Failed to retrieve order details.');
          }
        } catch (err) {
          console.error('Error fetching order:', err);
          setError('An error occurred.');
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
    } else {
      // If no external_id is provided via query, you might still show a generic success message
      setLoading(false);
    }
  }, [router.query]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Inter', sans-serif" }}>Processing your payment...</div>;
  }

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
      padding: '20px', 
      backgroundColor: '#fafafa', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '40px',
        width: '450px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#111', 
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          backgroundClip: 'text' 
        }}>
          Payment Successful!
        </h1>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
          Thank you for your purchase. Your order has been confirmed.
        </p>
        {orderInfo && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fff4', borderRadius: '12px' }}>
            <p style={{ margin: '5px 0', fontWeight: '600' }}>Order ID: {orderInfo.external_id}</p>
            <p style={{ margin: '5px 0', fontWeight: '600' }}>Amount: Rp {orderInfo.amount?.toLocaleString()}</p>
            {/* Add more order details as needed */}
          </div>
        )}
        {error && <p style={{ color: '#e53e3e', marginBottom: '20px' }}>{error}</p>}
        <button
          onClick={() => router.push('/')} // Redirect to homepage or dashboard
          style={{
            fontSize: '16px',
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            marginTop: '20px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}