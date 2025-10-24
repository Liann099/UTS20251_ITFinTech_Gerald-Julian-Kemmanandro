// pages/landingadmin.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faSignOutAlt,
  faBox,
  faShoppingCart,
  faChartLine,
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faBars,
  faChevronRight,
  faSync,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: ''
  });
  const [turnoverData, setTurnoverData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [chartType, setChartType] = useState('day');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orderFilter, setOrderFilter] = useState('latest'); // 'latest', 'pending', 'paid off'
  const router = useRouter();

  // Check if user is admin
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedData = JSON.parse(userData);
    if (parsedData.userType !== 'admin') {
      router.push('/');
    }
  }, [router]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        } else {
          console.error('Failed to fetch products');
          toast.error('Error loading products. Please check the console.');
        }
        // Fetch ALL orders initially
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setAllOrders(ordersData);
          const sortedOrders = [...ordersData].sort((a, b) => new Date(b.paid_at || b.created_at || 0) - new Date(a.paid_at || a.created_at || 0));
          setOrders(sortedOrders.slice(0, 5));
        } else {
          console.error('Failed to fetch orders');
          toast.error('Error loading orders. Please check the console.');
        }
        // Fetch analytics
        const analyticsRes = await fetch('/api/analytics');
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setTurnoverData(analyticsData.turnover);
          setSummaryData(analyticsData.summary);
        } else {
          console.error('Failed to fetch analytics');
          toast.error('Error loading analytics. Please check the console.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('An error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch turnover data when chart type changes
  useEffect(() => {
    const fetchTurnoverData = async () => {
      try {
        const analyticsRes = await fetch(`/api/analytics?groupBy=${chartType}`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setTurnoverData(analyticsData.turnover);
        } else {
          console.error('Failed to fetch turnover data');
          toast.error('Error loading turnover data.');
        }
      } catch (error) {
        console.error('Error fetching turnover ', error);
        toast.error('An error occurred while loading turnover data.');
      }
    };
    fetchTurnoverData();
  }, [chartType]);

  // Filter orders
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...allOrders];
      if (searchTerm) {
        filtered = filtered.filter(order =>
          (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.status && order.status.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      if (orderFilter === 'pending') {
        filtered = filtered.filter(order => (order.status || '').toUpperCase() === 'PENDING');
      } else if (orderFilter === 'paid off') {
        filtered = filtered.filter(order => (order.status || '').toUpperCase() === 'PAID');
      } else if (orderFilter === 'latest') {
        filtered.sort((a, b) => new Date(b.paid_at || b.created_at || 0) - new Date(a.paid_at || a.created_at || 0));
        filtered = filtered.slice(0, 5);
      }
      setOrders(filtered);
    };
    applyFilters();
  }, [searchTerm, orderFilter, allOrders]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast.warn('Please fill all required fields');
      return;
    }
    const priceNumber = parseFloat(newProduct.price);
    if (isNaN(priceNumber)) {
      toast.warn('Price must be a valid number');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: priceNumber,
          category: newProduct.category,
          imageUrl: newProduct.imageUrl || '/public'
        }),
      });
      if (response.ok) {
        const createdProduct = await response.json();
        setProducts([...products, createdProduct]);
        setNewProduct({ name: '', price: '', category: '', imageUrl: '' });
        toast.success('Product added successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to add product:', errorData);
        toast.error(`Failed to add product: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('An error occurred while adding the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct.name || !editingProduct.price || !editingProduct.category) {
      toast.warn('Please fill all required fields');
      return;
    }
    const priceNumber = parseFloat(editingProduct.price);
    if (isNaN(priceNumber)) {
      toast.warn('Price must be a valid number');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          price: priceNumber,
          category: editingProduct.category,
          imageUrl: editingProduct.imageUrl
        }),
      });
      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
        setEditingProduct(null);
        toast.success('Product updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to update product:', errorData);
        toast.error(`Failed to update product: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('An error occurred while updating the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    if (!id) {
      toast.error('Invalid product ID');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProducts(products.filter(p => p._id !== id));
        toast.success('Product deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete product:', errorData);
        toast.error(`Failed to delete product: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('An error occurred while deleting the product.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditing = (product) => {
    setEditingProduct({ ...product });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || '').toUpperCase();
    if (normalizedStatus === 'PAID') {
      return '#34d399';
    } else if (normalizedStatus === 'PENDING') {
      return '#facc15';
    } else {
      return '#ef4444';
    }
  };

  const refreshOrders = async () => {
    setLoading(true);
    try {
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setAllOrders(ordersData);
        setSearchTerm('');
      } else {
        console.error('Failed to refresh orders');
        toast.error('Error refreshing orders.');
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      toast.error('An error occurred while refreshing orders.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{
            position: 'absolute',
            border: '4px solid rgba(255,255,255,0.2)',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            position: 'absolute',
            border: '4px solid rgba(255,255,255,0.2)',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            top: '10px',
            left: '10px',
            animation: 'spin 1.5s linear infinite reverse'
          }} />
        </div>
        <p style={{ color: '#fff', marginTop: '24px', fontSize: '18px', fontWeight: '600' }}>Loading Dashboard...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Head>
        <title>Admin Dashboard - Daiko Tapes</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
          animation: 'float 15s ease-in-out infinite reverse'
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '20px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          animation: 'slideDown 0.6s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <FontAwesomeIcon icon={faBars} style={{ color: '#fff' }} />
            </button>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              DAIKO TAPES
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '12px 16px 12px 44px',
                  borderRadius: '14px',
                  border: '2px solid transparent',
                  width: '280px',
                  fontSize: '15px',
                  backgroundColor: '#f3f4f6',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('userData');
                localStorage.removeItem('isVerified');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Sidebar */}
          <aside style={{
            width: sidebarOpen ? '280px' : '0',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              padding: '28px',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              animation: 'slideRight 0.6s ease-out',
              height: 'fit-content',
              position: 'sticky',
              top: '24px'
            }}>
              <h3 style={{ fontWeight: '700', marginBottom: '24px', color: '#111827', fontSize: '20px', letterSpacing: '-0.3px' }}>Navigation</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  { id: 'products-section', label: 'Manage Products', icon: faBox, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                  { id: 'orders-section', label: 'View Orders', icon: faShoppingCart, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                  { id: 'analytics-section', label: 'Analytics', icon: faChartLine, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
                ].map((item, idx) => (
                  <li key={item.id} style={{ marginBottom: '12px', animation: `slideRight 0.6s ease-out ${idx * 0.1}s backwards` }}>
                    <button
                      onClick={() => document.getElementById(item.id).scrollIntoView({ behavior: 'smooth' })}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        textAlign: 'left',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        fontWeight: '600',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        fontSize: '15px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = item.gradient;
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateX(8px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <FontAwesomeIcon icon={item.icon} style={{ fontSize: '18px' }} />
                      {item.label}
                      <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.5 }} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Products Section */}
            <section id="products-section" style={{ marginBottom: '60px', animation: 'fadeInUp 0.6s ease-out' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '28px',
                letterSpacing: '-0.5px',
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                Manage Products
              </h2>
              {/* Add Product Form */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '32px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{ fontWeight: '700', marginBottom: '24px', color: '#111827', fontSize: '20px' }}>
                  {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                  {[
                    { label: 'Product Name', type: 'text', value: editingProduct ? editingProduct.name : newProduct.name, onChange: (e) => editingProduct ? setEditingProduct({ ...editingProduct, name: e.target.value }) : setNewProduct({ ...newProduct, name: e.target.value }), icon: '📦' },
                    { label: 'Price', type: 'number', value: editingProduct ? editingProduct.price : newProduct.price, onChange: (e) => editingProduct ? setEditingProduct({ ...editingProduct, price: e.target.value }) : setNewProduct({ ...newProduct, price: e.target.value }), icon: '💰' },
                    { label: 'Category', type: 'select', value: editingProduct ? editingProduct.category : newProduct.category, onChange: (e) => editingProduct ? setEditingProduct({ ...editingProduct, category: e.target.value }) : setNewProduct({ ...newProduct, category: e.target.value }), icon: '🏷️' },
                    { label: 'Image', type: 'file', value: '', onChange: editingProduct ? handleEditImageChange : handleImageChange, icon: '🖼️' }
                  ].map((field, index) => (
                    <div key={index}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                        <span>{field.icon}</span>
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '14px',
                            fontSize: '15px',
                            backgroundColor: '#f9fafb',
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.backgroundColor = '#fff';
                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#f9fafb';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <option value="">Select Category</option>
                          <option value="Industrial">Industrial</option>
                          <option value="Paper">Paper</option>
                          <option value="Hard">Hard</option>
                        </select>
                      ) : field.type === 'file' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={field.onChange}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '14px',
                              fontSize: '15px',
                              backgroundColor: '#f9fafb',
                              transition: 'all 0.3s ease',
                              outline: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#667eea';
                              e.target.style.backgroundColor = '#fff';
                              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e5e7eb';
                              e.target.style.backgroundColor = '#f9fafb';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          {(newProduct.imageUrl || (editingProduct && editingProduct.imageUrl)) && (
                            <div style={{
                              marginTop: '8px',
                              width: '100%',
                              height: '100px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img
                                src={newProduct.imageUrl || (editingProduct ? editingProduct.imageUrl : '')}
                                alt="Preview"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '14px',
                            fontSize: '15px',
                            backgroundColor: '#f9fafb',
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            fontWeight: '500'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.backgroundColor = '#fff';
                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#f9fafb';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '28px', display: 'flex', gap: '14px' }}>
                  {editingProduct ? (
                    <>
                      <button
                        onClick={handleUpdateProduct}
                        disabled={loading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '14px 28px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '14px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '15px',
                          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        {loading ? 'Updating...' : 'Update Product'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '14px 28px',
                          background: '#e5e7eb',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '15px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#d1d5db';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddProduct}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '14px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '15px',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      {loading ? 'Adding...' : 'Add Product'}
                    </button>
                  )}
                </div>
              </div>
              {/* Products List */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h3 style={{ fontWeight: '700', marginBottom: '28px', color: '#111827', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📦</span> Product List
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                  {products.map((product, idx) => (
                    <div key={product._id} style={{
                      backgroundColor: '#fff',
                      borderRadius: '20px',
                      padding: '24px',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '2px solid transparent',
                      animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s backwards`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.3)';
                        e.currentTarget.style.borderColor = '#667eea';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.5px'
                      }}>
                        {product.category}
                      </div>
                      <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '20px',
                        minHeight: '180px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={product.imageUrl || '/public'}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>
                      <h4 style={{
                        fontSize: '17px',
                        fontWeight: '700',
                        marginBottom: '10px',
                        color: '#111827',
                        letterSpacing: '-0.2px'
                      }}>
                        {product.name}
                      </h4>
                      <p style={{
                        fontSize: '22px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '16px'
                      }}>
                        Rp.{(product.price != null && typeof product.price === 'number') ? product.price.toLocaleString() : 'N/A'}
                      </p>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                          onClick={() => startEditing(product)}
                          style={{
                            flex: 1,
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(52, 211, 153, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 211, 153, 0.3)';
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} style={{ marginRight: '6px' }} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          style={{
                            flex: 1,
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} style={{ marginRight: '6px' }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Orders Section — FIXED */}
            <section id="orders-section" style={{ marginBottom: '60px', animation: 'fadeInUp 0.6s ease-out 0.2s backwards' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '28px',
                letterSpacing: '-0.5px',
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                Order Management
              </h2>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontWeight: '700', color: '#111827', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🛒</span> Recent Orders
                    <button
                      onClick={refreshOrders}
                      style={{
                        marginLeft: '15px',
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="Refresh Orders"
                    >
                      <FontAwesomeIcon icon={faSync} />
                    </button>
                  </h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['latest', 'pending', 'paid off'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setOrderFilter(filter)}
                        style={{
                          padding: '8px 16px',
                          background: orderFilter === filter
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#f3f4f6',
                          color: orderFilter === filter ? '#fff' : '#6b7280',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxShadow: orderFilter === filter
                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                            : 'none'
                        }}
                        onMouseOver={(e) => {
                          if (orderFilter !== filter) {
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                          }
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          if (orderFilter !== filter) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px', borderRadius: '12px 0 0 0' }}>Customer</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>Product</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px' }}>Date</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '14px', borderRadius: '0 12px 0 0' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length > 0 ? (
                        orders.map((order, idx) => {
                          // ✅ FIX: Extract customer name correctly
                          const customerName = order.customer_name || order.customer_email || 'Anonymous';

                          // ✅ FIX: Extract product name(s) from `items`
                          let productName = 'N/A';
                          if (Array.isArray(order.items) && order.items.length > 0) {
                            if (order.items[0].name) {
                              // Items contain product names directly
                              productName = order.items.map(item => item.name).join(', ');
                            } else if (order.items[0].productId) {
                              // Items contain product IDs → match with products list
                              const matched = order.items
                                .map(item => products.find(p => p._id === item.productId))
                                .filter(Boolean)
                                .map(p => p.name);
                              productName = matched.length > 0 ? matched.join(', ') : 'Unknown Product';
                            } else {
                              productName = 'Legacy Order';
                            }
                          }

                          const displayDate = order.paid_at || order.created_at || 'N/A';
                          const formattedDate = displayDate !== 'N/A' ? new Date(displayDate).toLocaleDateString() : 'N/A';

                          return (
                            <tr key={order._id || order.id} style={{
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'all 0.3s ease',
                              animation: `fadeInUp 0.6s ease-out ${idx * 0.05}s backwards`
                            }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                e.currentTarget.style.transform = 'scale(1.01)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <td style={{ padding: '16px 20px', color: '#1f2937', fontWeight: '600', fontSize: '15px' }}>
                                {customerName}
                              </td>
                              <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '15px' }}>
                                {productName}
                              </td>
                              <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '15px' }}>
                                {formattedDate}
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  padding: '8px 16px',
                                  borderRadius: '12px',
                                  background: `linear-gradient(135deg, ${getStatusColor(order.status)}15 0%, ${getStatusColor(order.status)}25 100%)`,
                                  color: getStatusColor(order.status),
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  border: `2px solid ${getStatusColor(order.status)}40`,
                                  display: 'inline-block',
                                  letterSpacing: '0.3px'
                                }}>
                                  {order.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                            No orders found matching the current filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Analytics Section — WITH YOUR CUSTOM CHART */}
            <section id="analytics-section" style={{ marginBottom: '60px', animation: 'fadeInUp 0.6s ease-out 0.4s backwards' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '28px',
                letterSpacing: '-0.5px',
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                Analytics
              </h2>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '32px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h3 style={{ fontWeight: '700', color: '#111827', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>📈</span> Turnover Chart
                  </h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['day', 'month'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        style={{
                          padding: '10px 20px',
                          background: chartType === type
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#f3f4f6',
                          color: chartType === type ? '#fff' : '#6b7280',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.3s ease',
                          boxShadow: chartType === type
                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                            : 'none'
                        }}
                        onMouseOver={(e) => {
                          if (chartType !== type) {
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                          }
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                          if (chartType !== type) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}ly
                      </button>
                    ))}
                  </div>
                </div>

                {/* YOUR CUSTOM CHART */}
                <div style={{
                  height: '400px',
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  position: 'relative',
                  border: '1px solid #e5e7eb'
                }}>
                  {turnoverData.length > 0 ? (
                    <>
                      {/* Y-Axis Labels */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        paddingRight: '12px',
                        borderRight: '2px solid #e5e7eb',
                        minWidth: '80px'
                      }}>
                        {(() => {
                          const maxValue = Math.max(...turnoverData.map(d => d.amount));
                          const step = Math.ceil(maxValue / 5 / 50000) * 50000;
                          const labels = [];
                          for (let i = 5; i >= 0; i--) {
                            labels.push(
                              <div key={i} style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                fontWeight: '600',
                                textAlign: 'right'
                              }}>
                                {(step * i / 1000).toFixed(0)}k
                              </div>
                            );
                          }
                          return labels;
                        })()}
                      </div>

                      {/* Chart Area */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {/* Grid Lines and Bars Container */}
                        <div style={{
                          flex: 1,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '12px'
                        }}>
                          {/* Horizontal Grid Lines */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            pointerEvents: 'none'
                          }}>
                            {[...Array(6)].map((_, i) => (
                              <div key={i} style={{
                                borderTop: i > 0 ? '1px dashed #e5e7eb' : 'none',
                                width: '100%'
                              }} />
                            ))}
                          </div>

                          {/* Bars */}
                          {(() => {
                            const maxValue = Math.max(...turnoverData.map(d => d.amount));
                            return turnoverData.map((data, index) => {
                              const heightPercent = maxValue > 0 ? (data.amount / maxValue) * 100 : 0;
                              return (
                                <div
                                  key={index}
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    position: 'relative',
                                    height: '100%',
                                    justifyContent: 'flex-end'
                                  }}
                                >
                                  {/* Tooltip */}
                                  <div
                                    data-tooltip
                                    style={{
                                      position: 'absolute',
                                      top: '-45px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      backgroundColor: '#1f2937',
                                      color: '#fff',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                      opacity: 0,
                                      pointerEvents: 'none',
                                      transition: 'opacity 0.3s ease',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                      zIndex: 10
                                    }}
                                  >
                                    Rp.{data.amount.toLocaleString()}
                                  </div>
                                  
                                  {/* Bar */}
                                  <div
                                    data-bar
                                    style={{
                                      width: '100%',
                                      maxWidth: '60px',
                                      height: `${heightPercent}%`,
                                      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                      borderRadius: '8px 8px 0 0',
                                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                      position: 'relative',
                                      boxShadow: '0 -4px 12px rgba(102, 126, 234, 0.3)',
                                      transformOrigin: 'bottom',
                                      animation: `barGrow 1s ease-out ${index * 0.1}s backwards`,
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scaleY(1.05) scaleX(1.1)';
                                      e.currentTarget.style.filter = 'brightness(1.15)';
                                      const tooltip = e.currentTarget.parentElement.querySelector('[data-tooltip]');
                                      if (tooltip) tooltip.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                                      e.currentTarget.style.filter = 'brightness(1)';
                                      const tooltip = e.currentTarget.parentElement.querySelector('[data-tooltip]');
                                      if (tooltip) tooltip.style.opacity = '0';
                                    }}
                                  />
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* X-Axis Labels */}
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          borderTop: '2px solid #e5e7eb',
                          paddingTop: '12px'
                        }}>
                          {turnoverData.map((data, index) => (
                            <div key={index} style={{
                              flex: 1,
                              textAlign: 'center'
                            }}>
                              <span style={{
                                fontSize: '13px',
                                color: '#6b7280',
                                fontWeight: '600',
                                display: 'block'
                              }}>
                                {chartType === 'day' ? data.date.split('-')[2] : data.date.split('-')[1]}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* X-Axis Label */}
                        <div style={{
                          textAlign: 'center',
                          marginTop: '8px'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {chartType === 'day' ? 'Day' : 'Month'}
                          </span>
                        </div>
                      </div>

                      {/* Y-Axis Label */}
                      <div style={{
                        position: 'absolute',
                        left: '-25px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap'
                      }}>
                        Revenue (Rp)
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#6b7280', 
                      fontStyle: 'italic', 
                      padding: '40px',
                      fontSize: '15px'
                    }}>
                      No turnover data available for the selected period.
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {[
                  {
                    title: 'Summary',
                    icon: '📊',
                    items: [
                      { label: 'Total Orders', value: summaryData.totalOrders, color: '#1f2937', bg: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)' },
                      { label: 'Pending', value: summaryData.pendingOrders, color: '#f59e0b', bg: 'linear-gradient(135deg, #facc1515 0%, #f59e0b25 100%)' },
                      { label: 'Completed', value: summaryData.completedOrders, color: '#10b981', bg: 'linear-gradient(135deg, #34d39915 0%, #10b98125 100%)' }
                    ]
                  },
                  {
                    title: 'Revenue',
                    icon: '💰',
                    items: [
                      { label: 'Total Revenue', value: `Rp. ${summaryData.totalRevenue.toLocaleString()}`, color: '#667eea', bg: 'linear-gradient(135deg, #667eea15 0%, #764ba225 100%)' }
                    ]
                  }
                ].map((section, index) => (
                  <div key={index} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    animation: `fadeInUp 0.6s ease-out ${0.6 + index * 0.1}s backwards`
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 24px 70px rgba(0, 0, 0, 0.35)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    <h3 style={{ fontWeight: '700', marginBottom: '24px', color: '#111827', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>{section.icon}</span>
                      {section.title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {section.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            background: item.bg,
                            padding: '16px',
                            borderRadius: '14px',
                            border: `2px solid ${item.color}20`,
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateX(8px)';
                            e.currentTarget.style.borderColor = `${item.color}60`;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.borderColor = `${item.color}20`;
                          }}
                        >
                          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }}>{item.label}</p>
                          <p style={{ fontSize: '26px', fontWeight: '800', color: item.color, letterSpacing: '-0.5px' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes barGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
      `}</style>
    </div>
  );
}