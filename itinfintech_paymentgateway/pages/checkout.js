import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const router = useRouter();
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {

      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // PAJAK
  const total = subtotal + tax;
  const proceedToPayment = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/payment');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <Head>
        <title>Checkout</title>
      </Head>
      
      <header style={{ marginBottom: '20px' }}>
        <button onClick={() => router.back()}>&lt; Back</button>
        <h2 style={{ textAlign: 'center' }}>Checkout</h2>
      </header>

      {}
      <div>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h4>{item.name}</h4>
                <p>Rp.{item.price}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span style={{ margin: '0 10px' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <p>RP.{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))
        )}
      </div>

      {}
      <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p>Subtotal</p>
          <p>Rp.{subtotal.toFixed(2)}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p>Tax</p>
          <p>Rp.{tax.toFixed(2)}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <p>Total</p>
          <p>Rp.{total.toFixed(2)}</p>
        </div>
      </div>
      
      <button 
        onClick={proceedToPayment}
        style={{ width: '100%', padding: '10px', marginTop: '20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}
      >
        Continue to Payment →
      </button>
    </div>
  );
}