import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Payment() {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card');
  const router = useRouter();
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 5; // Asumsi tax shipping =]
  const total = subtotal + shipping;

  const handlePayment = async () => {
    alert('Connecting to payment gateway...');
    
    const orderDetails = {
      items: cart,
      total: total, 
    };

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDetails),
      });
      const data = await response.json();
      if (response.ok) {
        window.location.href = data.invoiceUrl;
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
      console.error('Payment initiation failed:', error);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <Head>
        <title>Secure Checkout</title>
      </Head>

      <header style={{ marginBottom: '20px' }}>
        <button onClick={() => router.back()}>&lt; Back</button>
        <h2 style={{ textAlign: 'center' }}>Secure Checkout</h2>
      </header>

      {/* Alamat Pengiriman */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Shipping Address</h4>
        <input type="text" placeholder="Enter your address" style={{ width: '100%', padding: '8px' }} />
      </div>

      {/* Metode Pembayaran */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Payment Method</h4>
        <div>
          <input type="radio" id="card" name="payment" value="Credit/Debit Card" checked={paymentMethod === 'Credit/Debit Card'} onChange={(e) => setPaymentMethod(e.target.value)} />
          <label htmlFor="card"> Credit/Debit Card</label>
        </div>
        <div>
          <input type="radio" id="paypal" name="payment" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} />
          <label htmlFor="paypal"> PayPal</label>
        </div>
        <div>
          <input type="radio" id="other" name="payment" value="Other" checked={paymentMethod === 'Other'} onChange={(e) => setPaymentMethod(e.target.value)} />
          <label htmlFor="other"> Other (e.g., E-Wallet, Bank Transfer)</label>
        </div>
      </div>

      {/* Ringkasan Pesanan */}
      <div>
        <h4>Order Summary</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p>Item(s)</p>
          <p>Rp.{subtotal.toFixed(2)}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p>Shipping</p>
          <p>Rp.{shipping.toFixed(2)}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}>
          <p>Total</p>
          <p>Rp.{total.toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={handlePayment}
        style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '1em' }}
      >
        Confirm & Pay
      </button>
    </div>
  );
}