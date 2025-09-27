// pages/payment.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Payment() {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card');
  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    country: '',
    address: '',
    town: '',
    state: '',
    postcode: ''
  });
  const [isShippingValid, setIsShippingValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0; // Changed to Free
  const total = subtotal + shipping;

  const handlePayment = async () => {
    if (!email.includes('@') || !isShippingValid) {
      alert('Please enter a valid email and complete the shipping address.');
      return;
    }

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

  const validateShipping = () => {
    const { firstName, country, address, town, state, postcode } = shippingAddress;
    const isValid = firstName && country && address && town && state && postcode;
    setIsShippingValid(isValid);
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => {
      const newAddress = { ...prev, [field]: value };
      validateShipping();
      return newAddress;
    });
  };

  const toggleProductDetails = (e) => {
    const dropdown = e.target.nextElementSibling;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f9f9f9', color: '#333', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Secure Payment</title>
      </Head>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>&lt; Back</button>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', color: '#333' }}>PAYMENT</h1>
        <div style={{ color: '#888' }}>
          <div style={{ borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '5px', color: isShippingValid ? '#333' : '#ff4444' }}>Shipping Information</div>
          <div>Payment</div>
        </div>
      </header>
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>CONTACT</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
          />
          <label>
            <input type="checkbox" style={{ marginRight: '5px' }} /> Remember me
          </label>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '20px', marginBottom: '20px', textTransform: 'uppercase' }}>DELIVERY ADDRESS</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) => handleAddressChange('firstName', e.target.value)}
                placeholder="First Name"
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
              />
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) => handleAddressChange('lastName', e.target.value)}
                placeholder="Last Name"
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
              />
            </div>
            <input
              type="text"
              value={shippingAddress.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              placeholder="Country"
              style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
            />
            <input
              type="text"
              value={shippingAddress.address}
              onChange={(e) => handleAddressChange('address', e.target.value)}
              placeholder="Address"
              style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
            />
            <div style={{ display: 'flex', gap: '15px' }}>
              <input
                type="text"
                value={shippingAddress.town}
                onChange={(e) => handleAddressChange('town', e.target.value)}
                placeholder="Town"
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
              />
              <input
                type="text"
                value={shippingAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="State"
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
              />
              <input
                type="text"
                value={shippingAddress.postcode}
                onChange={(e) => handleAddressChange('postcode', e.target.value)}
                placeholder="Postcode/ZIP"
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', backgroundColor: '#fff', color: '#333' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>Payment Method</h4>
            <div style={{ marginBottom: '10px' }}>
              <div
                onClick={() => setPaymentMethod('Credit/Debit Card')}
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f1f1f1', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer'
                }}
              >
                <input type="radio" id="card" name="payment" value="Credit/Debit Card" checked={paymentMethod === 'Credit/Debit Card'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '10px' }} />
                <img src="https://via.placeholder.com/30x20?text=Visa" alt="Visa" style={{ marginRight: '10px' }} />
                <img src="https://via.placeholder.com/30x20?text=Amex" alt="Amex" />
                <label htmlFor="card" style={{ marginLeft: '10px', color: '#333' }}>Credit/Debit Card</label>
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div
                onClick={() => setPaymentMethod('PayPal')}
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f1f1f1', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer'
                }}
              >
                <input type="radio" id="paypal" name="payment" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '10px' }} />
                <img src="https://via.placeholder.com/30x20?text=PayPal" alt="PayPal" />
                <label htmlFor="paypal" style={{ marginLeft: '10px', color: '#333' }}>PayPal</label>
              </div>
            </div>
            <div>
              <div
                onClick={() => setPaymentMethod('Other')}
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f1f1f1', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer'
                }}
              >
                <input type="radio" id="other" name="payment" value="Other" checked={paymentMethod === 'Other'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '10px' }} />
                <img src="https://via.placeholder.com/30x20?text=Other" alt="Other" />
                <label htmlFor="other" style={{ marginLeft: '10px', color: '#333' }}>Other (e.g., E-Wallet, Bank Transfer)</label>
              </div>
            </div>
          </div>
        </div>
        <div style={{ width: '300px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>DETAIL PRODUCT</h2>
          <div>
            {cart.length <= 2 ? (
              cart.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', backgroundColor: '#f1f1f1', borderRadius: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img 
                      src={item.imageUrl || 'https://via.placeholder.com/50x75'} 
                      alt={item.name} 
                      style={{ width: '50px', height: '75px', objectFit: 'contain', marginRight: '10px' }} 
                    />
                    <div>
                      <p style={{ fontSize: '14px', margin: '0', color: '#333' }}>{item.name}</p>
                      <p style={{ fontSize: '12px', color: '#888' }}>1x Rp.{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <p style={{ fontWeight: 'bold', color: '#333' }}>Rp.{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              ))
            ) : (
              <>
                {cart.slice(0, 2).map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', backgroundColor: '#f1f1f1', borderRadius: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={item.imageUrl || 'https://via.placeholder.com/50x75'} 
                        alt={item.name} 
                        style={{ width: '50px', height: '75px', objectFit: 'contain', marginRight: '10px' }} 
                      />
                      <div>
                        <p style={{ fontSize: '14px', margin: '0', color: '#333' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#888' }}>1x Rp.{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <p style={{ fontWeight: 'bold', color: '#333' }}>Rp.{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                  </div>
                ))}
                <div>
                  <button onClick={toggleProductDetails} style={{ width: '100%', padding: '10px', backgroundColor: '#f1f1f1', border: '1px solid #ddd', borderRadius: '5px', color: '#333', marginBottom: '15px' }}>
                    View {cart.length - 2} more items...
                  </button>
                  <div style={{ display: 'none' }}>
                    {cart.slice(2).map(item => (
                      <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', backgroundColor: '#f1f1f1', borderRadius: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img 
                            src={item.imageUrl || 'https://via.placeholder.com/50x75'} 
                            alt={item.name} 
                            style={{ width: '50px', height: '75px', objectFit: 'contain', marginRight: '10px' }} 
                          />
                          <div>
                            <p style={{ fontSize: '14px', margin: '0', color: '#333' }}>{item.name}</p>
                            <p style={{ fontSize: '12px', color: '#888' }}>1x Rp.{item.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <p style={{ fontWeight: 'bold', color: '#333' }}>Rp.{(item.price * (item.quantity || 1)).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#333' }}>SUB TOTAL</p>
              <p style={{ fontWeight: 'bold', color: '#333' }}>Rp.{subtotal.toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#333' }}>SHIPPING</p>
              <p>Free</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#333' }}>TOTAL</p>
              <p style={{ fontWeight: 'bold', color: '#333' }}>Rp.{total.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={handlePayment}
            style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '1em', fontWeight: 'bold' }}
          >
            Confirm & Pay
          </button>
        </div>
      </div>
    </div>
  );
}