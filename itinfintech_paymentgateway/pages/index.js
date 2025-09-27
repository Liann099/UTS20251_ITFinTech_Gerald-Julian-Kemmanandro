// pages/index.js
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
  const router = useRouter();

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

    // Filter by search term
    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type (assuming products have a 'category' field)
    if (selectedType) {
      tempProducts = tempProducts.filter(product => product.category === selectedType);
    }

    // Filter by price range
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

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <Head>
        <title>Select Item</title>
      </Head>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>DAIKO TAPES</h1>
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', borderRadius: '20px', border: '1px solid #ddd', width: '500px', textAlign: 'center' }} 
        />
        <button 
          onClick={goToCheckout} 
          style={{ 
            fontSize: '16px', 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '20px', 
            cursor: 'pointer' 
          }}
        >
          Check Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      </header>
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto' }}>
        <aside style={{ width: '250px', marginRight: '40px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              <option value="">Clear</option>
              <option value="Industrial">Industrial</option>
              <option value="Paper">Paper</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Price</label>
            <select 
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              <option value="">All</option>
              <option>Rp. 10.000 - Rp. 50.000</option>
              <option>Rp. 50.000 - Rp. 100.000</option>
              <option>Rp.100.000 - Rp. 200.000</option>
              <option>Rp.200.000++</option>
            </select>
          </div>
        </aside>
        <main style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {filteredProducts.map((product) => (
              <div key={product._id} style={{ backgroundColor: '#fff', borderRadius: '30px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/250x150?text=Product+Image'} 
                  alt={product.name} 
                  style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '10px' }} 
                />
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{product.name}</h4>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Rp.{product.price}</p>
                <button onClick={() => addToCart(product)} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '20px' }}>
                  Add +
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}