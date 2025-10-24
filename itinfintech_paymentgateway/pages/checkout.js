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
  const total = subtotal; 

  const proceedToPayment = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/payment');
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: '40px 20px', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Head>
        <title>Checkout</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <button 
            onClick={() => router.back()}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#fff', 
              border: '2px solid #e0e0e0', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              fontWeight: '600', 
              fontSize: '14px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.transform = 'translateX(-4px)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.transform = 'translateX(0)';
            }}
          >← Back</button>
          <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '1px' }}>CHECKOUT</h2>
          <div style={{ width: '120px' }}></div>
        </header>
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ flex: 1, backgroundColor: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#222' }}>🛍️ Your Items</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
                <p style={{ fontSize: '18px', color: '#999', fontWeight: '500' }}>Your cart is empty.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '20px', borderBottom: '2px solid #f5f5f5', borderRadius: '16px', transition: 'all 0.3s ease', backgroundColor: '#fafafa' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5ff';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', marginRight: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '80px', height: '100px', objectFit: 'contain' }}
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#222' }}>{item.name}</h4>
                      <p style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>Unit Price: <span style={{ fontWeight: '600', color: '#667eea' }}>Rp.{item.price.toLocaleString()}</span></p>
                      <p style={{ fontSize: '13px', color: '#999' }}>Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '8px 12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity - 1)} 
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#f5f5f5', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '16px',
                          transition: 'all 0.2s ease',
                          color: '#667eea'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#667eea';
                          e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#f5f5f5';
                          e.target.style.color = '#667eea';
                        }}
                      >−</button>
                      <span style={{ margin: '0 8px', fontWeight: '700', fontSize: '16px', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)} 
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#f5f5f5', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '16px',
                          transition: 'all 0.2s ease',
                          color: '#667eea'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#667eea';
                          e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#f5f5f5';
                          e.target.style.color = '#667eea';
                        }}
                      >+</button>
                    </div>
                    <button 
                      onClick={() => removeItem(item._id)} 
                      style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#fff', 
                        color: '#ff4757', 
                        border: '2px solid #ffecee', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#ff4757';
                        e.target.style.color = '#fff';
                        e.target.style.borderColor = '#ff4757';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.color = '#ff4757';
                        e.target.style.borderColor = '#ffecee';
                      }}
                    >🗑️</button>
                    <p style={{ marginLeft: '20px', fontSize: '18px', fontWeight: '700', color: '#667eea', minWidth: '120px', textAlign: 'right' }}>Rp.{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '3px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <p style={{ fontWeight: '700', fontSize: '20px', color: '#222' }}>TOTAL TO PAY</p>
                <p style={{ fontWeight: '700', fontSize: '28px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Rp.{total.toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', backgroundColor: '#f0f9ff', padding: '12px 16px', borderRadius: '12px', border: '2px dashed #bfdbfe' }}>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>🚚 Free Shipping Nationwide!</p>
                <p style={{ fontWeight: '700', color: '#10b981' }}>Rp.0</p>
              </div>
            </div>
          </div>
          <div style={{ width: '380px', backgroundColor: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#222' }}>📋 Order Summary</h3>
            <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '16px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>No items yet</p>
              ) : (
                cart.map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #e0e0e0' }}>
                    <p style={{ fontSize: '14px', color: '#555', flex: 1 }}>{item.name} <span style={{ color: '#999', fontWeight: '600' }}>× {item.quantity}</span></p>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#667eea', marginLeft: '12px' }}>Rp.{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: '#888' }}>Subtotal</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Rp.{subtotal.toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: '#888' }}>Shipping</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Free</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px dashed #e0e0e0' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#222' }}>Total</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#667eea' }}>Rp.{total.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={proceedToPayment}
              disabled={cart.length === 0}
              style={{ 
                width: '100%', 
                padding: '16px', 
                marginTop: '8px', 
                background: cart.length === 0 ? '#e0e0e0' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '16px', 
                fontWeight: '700', 
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                boxShadow: cart.length === 0 ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.3)',
                opacity: cart.length === 0 ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (cart.length > 0) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (cart.length > 0) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              Continue to Payment →
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '16px' }}>🔒 Secure checkout powered by DAIKO</p>
          </div>
        </div>
      </div>
    </div>
  );
}