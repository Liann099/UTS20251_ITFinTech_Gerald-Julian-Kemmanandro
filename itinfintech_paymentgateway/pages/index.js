import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

// Data produk sementara (akan diganti dengan data dari MongoDB)
const initialProducts = [
  { id: 1, name: 'Product A', price: 100, description: 'Short description A', category: 'Drinks' },
  { id: 2, name: 'Product B', price: 150, description: 'Short description B', category: 'Snacks' },
  { id: 3, name: 'Product C', price: 200, description: 'Short description C', category: 'Bundles' },
];

export default function SelectItem() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const router = useRouter();

  const addToCart = (product) => {
    // Cek apakah produk sudah ada di keranjang
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      // Jika sudah ada, tambah quantity
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      // Jika belum ada, tambahkan ke keranjang
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    console.log('Cart:', cart); // Untuk cek isi keranjang di console
  };

  const goToCheckout = () => {
    // Simpan data keranjang ke localStorage agar bisa diakses di halaman checkout
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <Head>
        <title>Select Item</title>
      </Head>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Logo</h2>
        <button onClick={goToCheckout}>
          Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      </header>

      {/* Tampilan produk */}
      <div>
        <h3>All Products</h3>
        {products.map((product) => (
          <div key={product.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>{product.name}</h4>
            <p>${product.price}</p>
            <p>{product.description}</p>
            <button onClick={() => addToCart(product)}>Add +</button>
          </div>
        ))}
      </div>
    </div>
  );
}