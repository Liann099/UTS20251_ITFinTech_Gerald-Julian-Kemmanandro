// pages/payment.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Payment() {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card');
  const [shippingAddress, setShippingAddress] = useState({
    country: '',
    address: '',
    town: '',
    state: '',
    postcode: '',
    phone: ''
  });
  const [isShippingValid, setIsShippingValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // ✅ Load user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUserEmail(parsed.email || '');
        setUserName(parsed.name || '');
      } catch (e) {
        console.warn('Failed to parse user data');
        alert('User session invalid. Please log in again.');
        router.push('/login');
      }
    } else {
      alert('Please log in to proceed with payment.');
      router.push('/login');
    }
  }, [router]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const shipping = 10000;
  const total = subtotal + shipping;

  const handlePayment = async () => {
    if (!isShippingValid) {
      alert('Please complete the shipping address and phone number.');
      return;
    }

    if (!userEmail) {
      alert('User email not found. Please log in again.');
      return;
    }

    if (!shippingAddress.phone) {
      alert('Please provide a phone number for order updates.');
      return;
    }

    alert('Connecting to payment gateway...');

    const orderDetails = {
      items: cart.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl
      })),
      total: total,
      customer_email: userEmail,
      customer_name: userName || 'Customer',
      customer_phone: shippingAddress.phone
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

  const validateShipping = () => {
    const { country, address, town, state, postcode, phone } = shippingAddress;
    const isValid = country && address && town && state && postcode && phone;
    setIsShippingValid(isValid);
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => {
      const newAddress = { ...prev, [field]: value };
      return newAddress;
    });
  };

  useEffect(() => {
    validateShipping();
  }, [shippingAddress]);

  const toggleProductDetails = (e) => {
    const dropdown = e.target.nextElementSibling;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
      padding: '20px', 
      backgroundColor: '#fafafa', 
      color: '#333', 
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      boxSizing: 'border-box'
    }}>
      <Head>
        <title>Secure Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{ maxWidth: '1200px', width: '100%', boxSizing: 'border-box' }}>
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
          <h1 style={{ fontSize: '40px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PAYMENT</h1>
          <div style={{ color: '#888', fontSize: '14px', textAlign: 'right' }}>
            <div style={{ borderBottom: '2px solid #667eea', paddingBottom: '8px', marginBottom: '8px', color: isShippingValid ? '#10b981' : '#ff4757', fontWeight: '600', transition: 'all 0.3s ease' }}>
              {isShippingValid ? '✓' : '○'} Shipping Information
            </div>
            <div style={{ fontWeight: '600', color: '#667eea' }}>○ Payment</div>
          </div>
        </header>
        
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '0', marginBottom: '20px', textTransform: 'uppercase', color: '#222', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🏠 DELIVERY ADDRESS
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                value={shippingAddress.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="Country *"
                style={{ width: '100%', padding: '14px 20px', marginBottom: '0', border: '2px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fff', color: '#333', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) => handleAddressChange('address', e.target.value)}
                placeholder="Street Address *"
                style={{ width: '100%', padding: '14px 20px', marginBottom: '0', border: '2px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fff', color: '#333', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <input
                  type="text"
                  value={shippingAddress.town}
                  onChange={(e) => handleAddressChange('town', e.target.value)}
                  placeholder="Town/City *"
                  style={{ padding: '14px 20px', border: '2px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fff', color: '#333', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="State/Province *"
                  style={{ padding: '14px 20px', border: '2px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fff', color: '#333', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <input
                  type="text"
                  value={shippingAddress.postcode}
                  onChange={(e) => handleAddressChange('postcode', e.target.value)}
                  placeholder="Postcode/ZIP *"
                  style={{ padding: '14px 20px', border: '2px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fff', color: '#333', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>
                  📱 Phone Number *
                </label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value)}
                  placeholder="+62 812 3456 7890"
                  style={{ width: '100%', padding: '14px 20px', marginBottom: '0', border: '2px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#fff', color: '#333', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '6px', marginBottom: '0' }}>
                  We'll send order updates via WhatsApp
                </p>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#222', display: 'flex', alignItems: 'center', gap: '10px' }}>💳 Payment Method</h4>
              <div style={{ marginBottom: '12px' }}>
                <div
                  onClick={() => setPaymentMethod('Credit/Debit Card')}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: paymentMethod === 'Credit/Debit Card' ? '#f5f5ff' : '#fafafa', border: paymentMethod === 'Credit/Debit Card' ? '2px solid #667eea' : '2px solid #e0e0e0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (paymentMethod !== 'Credit/Debit Card') {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (paymentMethod !== 'Credit/Debit Card') {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                >
                  <input type="radio" id="card" name="payment" value="Credit/Debit Card" checked={paymentMethod === 'Credit/Debit Card'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                    <div style={{ width: '40px', height: '28px', backgroundColor: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#1434CB', border: '1px solid #e0e0e0' }}>VISA</div>
                    <div style={{ width: '40px', height: '28px', backgroundColor: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#016FD0', border: '1px solid #e0e0e0' }}>AMEX</div>
                  </div>
                  <label htmlFor="card" style={{ marginLeft: '0', color: '#333', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>Credit/Debit Card</label>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div
                  onClick={() => setPaymentMethod('PayPal')}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: paymentMethod === 'PayPal' ? '#f5f5ff' : '#fafafa', border: paymentMethod === 'PayPal' ? '2px solid #667eea' : '2px solid #e0e0e0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (paymentMethod !== 'PayPal') {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (paymentMethod !== 'PayPal') {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                >
                  <input type="radio" id="paypal" name="payment" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }} />
                  <div style={{ width: '40px', height: '28px', backgroundColor: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#003087', border: '1px solid #e0e0e0', marginRight: '12px' }}>PayPal</div>
                  <label htmlFor="paypal" style={{ marginLeft: '0', color: '#333', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>PayPal</label>
                </div>
              </div>
              <div>
                <div
                  onClick={() => setPaymentMethod('Other')}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: paymentMethod === 'Other' ? '#f5f5ff' : '#fafafa', border: paymentMethod === 'Other' ? '2px solid #667eea' : '2px solid #e0e0e0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (paymentMethod !== 'Other') {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (paymentMethod !== 'Other') {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                >
                  <input type="radio" id="other" name="payment" value="Other" checked={paymentMethod === 'Other'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }} />
                  <div style={{ width: '40px', height: '28px', backgroundColor: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #e0e0e0', marginRight: '12px' }}>💰</div>
                  <label htmlFor="other" style={{ marginLeft: '0', color: '#333', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>Other (E-Wallet, Bank Transfer)</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: 'fit-content', position: 'sticky', top: '20px', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', color: '#222' }}>📦 DETAIL PRODUCT</h2>
            <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '20px' }}>
              {cart.length <= 2 ? (
                cart.map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '8px', marginRight: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          style={{ width: '50px', height: '75px', objectFit: 'contain' }} 
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#333', fontWeight: '600' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#888' }}>{item.quantity || 1}x <span style={{ color: '#667eea', fontWeight: '600' }}>Rp.{item.price.toLocaleString()}</span></p>
                      </div>
                    </div>
                    <p style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>Rp.{((item.price * (item.quantity || 1))).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <>
                  {cart.slice(0, 2).map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '8px', marginRight: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            style={{ width: '50px', height: '75px', objectFit: 'contain' }} 
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#333', fontWeight: '600' }}>{item.name}</p>
                          <p style={{ fontSize: '12px', color: '#888' }}>{item.quantity || 1}x <span style={{ color: '#667eea', fontWeight: '600' }}>Rp.{item.price.toLocaleString()}</span></p>
                        </div>
                      </div>
                      <p style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>Rp.{((item.price * (item.quantity || 1))).toLocaleString()}</p>
                    </div>
                  ))}
                  <div>
                    <button 
                      onClick={toggleProductDetails} 
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: '#f5f5ff', 
                        border: '2px solid #e0e0e0', 
                        borderRadius: '12px', 
                        color: '#667eea', 
                        marginBottom: '16px', 
                        cursor: 'pointer', 
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#667eea';
                        e.target.style.color = '#fff';
                        e.target.style.borderColor = '#667eea';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#f5f5ff';
                        e.target.style.color = '#667eea';
                        e.target.style.borderColor = '#e0e0e0';
                      }}
                    >
                      View {cart.length - 2} more items ▼
                    </button>
                    <div style={{ display: 'none' }}>
                      {cart.slice(2).map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '8px', marginRight: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                style={{ width: '50px', height: '75px', objectFit: 'contain' }} 
                              />
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#333', fontWeight: '600' }}>{item.name}</p>
                              <p style={{ fontSize: '12px', color: '#888' }}>{item.quantity || 1}x <span style={{ color: '#667eea', fontWeight: '600' }}>Rp.{item.price.toLocaleString()}</span></p>
                            </div>
                          </div>
                          <p style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>Rp.{((item.price * (item.quantity || 1))).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: '24px', borderTop: '2px solid #f0f0f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontWeight: '600', textTransform: 'uppercase', color: '#666', fontSize: '14px' }}>SUB TOTAL</p>
                <p style={{ fontWeight: '700', color: '#333', fontSize: '15px' }}>Rp.{subtotal.toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', backgroundColor: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', border: '2px dashed #bfdbfe' }}>
                <p style={{ fontWeight: '600', textTransform: 'uppercase', color: '#666', fontSize: '14px' }}>🚚 SHIPPING</p>
                <p style={{ fontWeight: '700', color: '#10b981', fontSize: '14px' }}>Free</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingTop: '12px', borderTop: '2px dashed #e0e0e0' }}>
                <p style={{ fontWeight: '700', textTransform: 'uppercase', color: '#222', fontSize: '16px' }}>TOTAL</p>
                <p style={{ fontWeight: '700', fontSize: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Rp.{total.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={handlePayment}
              style={{ 
                width: '100%', 
                padding: '16px', 
                marginTop: '8px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '16px', 
                fontSize: '16px', 
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
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
              Confirm & Pay 
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '16px' }}>🔒 Secure payment powered by DAIKO</p>
          </div>
        </div>
      </div>
    </div>
  );
}