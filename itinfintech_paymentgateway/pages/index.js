// pages/index.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SelectItem() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
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
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    getProducts();
  }, []);

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
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <Head>
        <title>Select Item</title>
      </Head>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Catalogue</h2>
        <button onClick={goToCheckout}>
          Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      </header>

      <div>
        <h3>All Products</h3>
        {products.map((product) => (
          <div key={product._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>{product.name}</h4>
            <p>Rp.{product.price}</p>
            <p>{product.description}</p>
            <button onClick={() => addToCart(product)}>Add +</button>
          </div>
        ))}
      </div>
    </div>
  );
}