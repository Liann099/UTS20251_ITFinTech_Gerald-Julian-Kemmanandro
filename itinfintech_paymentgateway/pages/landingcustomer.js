// pages/landingcustomer.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SelectItem() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userData, setUserData] = useState({}); // State to hold user data fetched from localStorage
  const router = useRouter();

  // Effect to fetch user data from localStorage on component mount
  useEffect(() => {
    // Check if user is logged in by verifying token and user data exist
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user'); // KEY CHANGE: Use 'user' key

    if (!token || !storedUser) {
      // If either is missing, redirect to login
      console.warn("Missing token or user data on landingcustomer page. Redirecting to login.");
      router.push('/login'); // Or '/' depending on your main login page path
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.userType !== 'customer') {
        // If not a customer, redirect appropriately
        console.warn("Non-customer user detected on landingcustomer page. Redirecting.");
        router.push('/'); // Or admin page if applicable
        return;
      }
      setUserData(parsedUser); // Set user data state
      console.log("DEBUG: User data loaded:", parsedUser); // Debug log
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      // Handle parsing error, maybe redirect to login
      router.push('/login');
    }
  }, [router]); // Add router to dependency array

  useEffect(() => {
    async function getProducts() {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    getProducts();
  }, []);

  useEffect(() => {
    let tempProducts = [...products];

    // search
    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType) {
      tempProducts = tempProducts.filter(product => product.category === selectedType);
    }

    // Filter price range
    if (selectedPriceRange) {
      let min = 0;
      let max = Infinity;
      if (selectedPriceRange === 'Rp. 10.000 - Rp. 50.000') {
        min = 10000;
        max = 50000;
      } else if (selectedPriceRange === 'Rp. 50.000 - Rp. 100.000') {
        min = 50000;
        max = 100000;
      } else if (selectedPriceRange === 'Rp.100.000 - Rp. 200.000') {
        min = 100000;
        max = 200000;
      } else if (selectedPriceRange === 'Rp.200.000++') {
        min = 200000;
      }
      tempProducts = tempProducts.filter(product => product.price >= min && (max ? product.price <= max : true));
    }

    setFilteredProducts(tempProducts);
  }, [searchTerm, selectedType, selectedPriceRange, products]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const goToCheckout = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  const handleLogout = () => {
    // Clear user data - remove keys used by both signup/login flows
    localStorage.removeItem('userData'); // Might still be present from signup, good to remove
    localStorage.removeItem('isVerified');
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // This is the main one used by login flow
    
    router.push('/'); // Redirect to main page or login page
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: '20px', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Head>
        <title>Select Item</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', maxWidth: '1200px', margin: '0 auto 50px auto', padding: '20px 0' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111', letterSpacing: '1px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DAIKO TAPES</h1>
        
        <input 
          type="text" 
          placeholder="🔍 Search products..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '14px 24px', borderRadius: '30px', border: '2px solid #e0e0e0', width: '500px', textAlign: 'left', fontSize: '15px', transition: 'all 0.3s ease', outline: 'none', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} 
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={goToCheckout} 
            style={{ 
              fontSize: '15px', 
              padding: '14px 28px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '30px', 
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginRight: '15px'
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
            🛒 Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
          
          {/* User Profile Icon */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowProfileModal(!showProfileModal)}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              👤
            </button>
            
            {/* Profile Modal */}
            {showProfileModal && (
              <div style={{
                position: 'absolute',
                top: '60px',
                right: '0',
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '20px',
                width: '300px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                zIndex: 100,
                border: '2px solid #e0e0e0'
              }}>
                <div style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <h3 style={{ margin: '0', color: '#333', fontWeight: '600' }}>User Profile</h3>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '8px 0', color: '#555' }}>
                    <strong>Name:</strong> {userData.name || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0', color: '#555' }}>
                    <strong>Email:</strong> {userData.email || 'N/A'}
                  </p>
                  {/* IMPORTANT: Ensure the field name matches your database schema */}
                  <p style={{ margin: '8px 0', color: '#555' }}>
                    <strong>Phone:</strong> {userData.phoneNumber || 'N/A'} {/* Change 'phoneNumber' if needed */}
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(229, 62, 62, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(229, 62, 62, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(229, 62, 62, 0.4)';
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', gap: '40px' }}>
        <aside style={{ width: '250px', marginRight: '0' }}>
          <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '12px', color: '#333', fontSize: '15px' }}>📦 Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '14px', backgroundColor: '#fafafa', cursor: 'pointer', transition: 'all 0.3s ease', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            >
              <option value="">All Types</option>
              <option value="Industrial">Industrial</option>
              <option value="Paper">Paper</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <label style={{ fontWeight: '600', display: 'block', marginBottom: '12px', color: '#333', fontSize: '15px' }}>💰 Price Range</label>
            <select 
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '14px', backgroundColor: '#fafafa', cursor: 'pointer', transition: 'all 0.3s ease', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            >
              <option value="">All Prices</option>
              <option>Rp. 10.000 - Rp. 50.000</option>
              <option>Rp. 50.000 - Rp. 100.000</option>
              <option>Rp.100.000 - Rp. 200.000</option>
              <option>Rp.200.000++</option>
            </select>
          </div>
        </aside>
        <main style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {filteredProducts.map((product) => (
              <div key={product._id} style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer', border: '2px solid transparent' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '16px', padding: '20px', marginBottom: '16px', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={product.imageUrl || '/public'} 
                    alt={product.name} 
                    style={{ width: '100%', height: '150px', objectFit: 'contain' }} 
                  />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#222', lineHeight: '1.4' }}>{product.name}</h4>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#667eea', marginBottom: '12px' }}>Rp.{product.price.toLocaleString()}</p>
                <button onClick={() => addToCart(product)} style={{ marginTop: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.3s ease', width: '100%' }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Add to Cart +
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}