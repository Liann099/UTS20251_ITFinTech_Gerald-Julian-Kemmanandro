// pages/checkout.js
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
    if (newQuantity < 1) {
      if (cart.length === 1) {
        if (confirm('Are you sure you want to delete the item?')) {
          setCart([]);
        }
      } else {
        setCart(cart.filter(item => item._id !== productId));
      }
    } else {
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (productId) => {
    if (cart.length === 1) {
      if (confirm('Are you sure you want to delete the item?')) {
        setCart([]);
      }
    } else {
      setCart(cart.filter(item => item._id !== productId));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // Simplified to just subtotal with free shipping

  const proceedToPayment = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/payment');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f9f9f9', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Checkout</title>
      </Head>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()}>&lt; Back</button>
        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>CHECKOUT</h2>
        <div></div>
      </header>
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/100x150'}
                    alt={item.name}
                    style={{ width: '100px', height: '150px', objectFit: 'contain', marginRight: '15px' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{item.name}</h4>
                    <p style={{ fontSize: '14px', color: '#666' }}>Qty: {item.quantity}, Rp.{item.price}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ padding: '5px 10px', backgroundColor: '#ddd', border: 'none', borderRadius: '5px' }}>-</button>
                  <span style={{ margin: '0' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ padding: '5px 10px', backgroundColor: '#ddd', border: 'none', borderRadius: '5px' }}>+</button>
                  <button onClick={() => removeItem(item._id)} style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '5px' }}>X</button>
                  <p style={{ marginLeft: '15px' }}>Rp.{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold' }}>TOTAL TO PAY</p>
              <p style={{ fontWeight: 'bold' }}>Rp.{total.toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
              <p>Free Shipping Nationwide!</p>
              <p>Rp.0.00</p>
            </div>
          </div>
        </div>
        <div style={{ width: '300px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Order Summary</h3>
          {cart.map(item => (
            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p>{item.name} x {item.quantity}</p>
              <p>Rp.{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <button
            onClick={proceedToPayment}
            style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Continue to Payment →
          </button>
        </div>
      </div>
    </div>
  );
}