// pages/index.js
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('customer'); // Default to customer
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: '', // Not used for admin
    name: '', // Not used for admin/login
    confirmPassword: '' // Not used for admin/login
  });
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // WhatsApp phone number validation function
  const validateWhatsAppNumber = (number) => {
    // Remove all non-digit characters
    const digitsOnly = number.replace(/\D/g, '');
    
    // Check if it starts with a valid country code
    // For Indonesia: starts with 62, for US: starts with 1, etc.
    // This is a simplified validation - you might want to be more specific based on your target countries
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return false;
    }
    
    // Basic format: + followed by country code and number
    // For example: +6281234567890 or 6281234567890
    return /^\+?[\d\s\-\(\)]+$/.test(number) && digitsOnly.length >= 10;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone number is required for customer signup/login, not for admin
    if (userType === 'customer') {
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!validateWhatsAppNumber(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Phone number is invalid. Use format: +6281234567890';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6 && userType !== 'admin') { // Admin password validation handled separately
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Name is required only for customer signup
    if (!isLogin && userType === 'customer') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Special case: Admin Login
        if (userType === 'admin' && isLogin) {
          // Hardcoded admin credentials
          const adminEmail = 'admin1@gmail.com';
          const adminPassword = 'admin1'; 
          
          if (formData.email === adminEmail && formData.password === adminPassword) {
            // Successful admin login
            const adminUserData = {
              email: adminEmail,
              name: 'Administrator',
              userType: 'admin'
              // Note: No userId, phoneNumber, or token for hardcoded login
            };
            localStorage.setItem('userData', JSON.stringify(adminUserData));
            // No token for hardcoded login, but you could generate one if needed
            // localStorage.setItem('token', 'some_admin_token');
            router.push('/landingadmin');
          } else {
            alert('Invalid admin credentials');
          }
          return; // Exit early for admin login
        }

        // Customer Signup
        if (!isLogin && userType === 'customer') {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              phoneNumber: formData.phoneNumber.replace(/\D/g, ''), // Send only digits to backend
              password: formData.password,
              name: formData.name,
              userType: userType
            }),
          });

          const data = await response.json();

          if (response.ok) {
            // Store user data in localStorage for verification page
            const userData = {
              email: formData.email,
              phoneNumber: formData.phoneNumber.replace(/\D/g, ''), // Store only digits
              name: formData.name,
              userType: userType,
              userId: data.userId 
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            router.push('/verification');
          } else {
            alert(data.message || 'Signup failed');
          }
        } 
        // Customer Login
        else if (isLogin && userType === 'customer') {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password
            }),
          });

          const data = await response.json();

          if (response.ok) {
            // CRITICAL FIX: Check verification status
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.userType === 'admin') {
              // This shouldn't happen with the current logic, but good to have
              router.push('/landingadmin');
            } else {
              // For customers, check if they are verified
              if (data.user.isVerified) {
                // Verified customer - go to their landing page
                router.push('/landingcustomer');
              } else {
                // Unverified customer - MUST go to verification page
                router.push('/verification');
              }
            }
          } else {
            alert(data.message || 'Login failed');
          }
        }
        // Admin Signup attempt (should be blocked by UI, but double-check)
        else if (!isLogin && userType === 'admin') {
           alert('Admin signup is not allowed. Please contact system administrator.');
        }
      } catch (error) {
        console.error('Request failed:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ 
      email: '', 
      password: '', 
      phoneNumber: '',
      name: '', 
      confirmPassword: '' 
    });
    setErrors({});
    // Keep userType as 'customer' by default when toggling modes
    // Admins use the specific login button
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
      padding: '20px', 
      backgroundColor: '#fafafa', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box' // Prevent overflow
    }}>
      <Head>
        <title>{isLogin ? 'Login' : 'Sign Up'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" /> {/* Ensure responsiveness */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '40px',
        width: '100%', // Use percentage width
        maxWidth: '450px', // Keep max width for larger screens
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        boxSizing: 'border-box', // Include padding/border in width calculation
        transition: 'all 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#111', 
            letterSpacing: '1px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {isLogin ? 'Sign in to continue' : 'Join us today'}
          </p>
        </div>

        {!isLogin && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '20px',
            gap: '10px'
          }}>
            <button
              onClick={() => setUserType('customer')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: userType === 'customer' 
                  ? '2px solid #667eea' 
                  : '2px solid #e0e0e0',
                backgroundColor: userType === 'customer' 
                  ? '#667eea' 
                  : '#f8f9fa',
                color: userType === 'customer' 
                  ? '#fff' 
                  : '#666',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Customer
            </button>
            {/* Admin signup is disabled/removed */}
            <button
              onClick={() => {
                alert('Admin signup is not allowed. Please contact system administrator or use the admin login.');
                // Keep userType as customer or reset form if needed
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0', // Always greyed out border
                backgroundColor: '#e9ecef', // Greyed out background
                color: '#6c757d', // Greyed out text
                fontWeight: '600',
                cursor: 'not-allowed', // Not-allowed cursor
                transition: 'none' // No transition for disabled look
              }}
              disabled // Actually disable the button
            >
              Admin (Signup Disabled)
            </button>
          </div>
        )}

        {/* Admin Login Shortcut/Button */}
        {isLogin && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setUserType('admin');
                setFormData({ email: 'admin1@gmail.com', password: 'admin1', phoneNumber: '', name: '', confirmPassword: '' });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '5px 10px',
                textDecoration: 'underline'
              }}
            >
              Login as Administrator
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name field only for customer signup */}
          {!isLogin && userType === 'customer' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '14px'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${errors.name ? '#e53e3e' : '#e0e0e0'}`,
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  backgroundColor: '#fafafa',
                  boxSizing: 'border-box' // Prevent overflow
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.name ? '#e53e3e' : '#e0e0e0'}
              />
              {errors.name && (
                <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '6px' }}>{errors.name}</p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#333',
              fontSize: '14px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: `2px solid ${errors.email ? '#e53e3e' : '#e0e0e0'}`,
                fontSize: '15px',
                transition: 'all 0.3s ease',
                outline: 'none',
                backgroundColor: '#fafafa',
                boxSizing: 'border-box' // Prevent overflow
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = errors.email ? '#e53e3e' : '#e0e0e0'}
            />
            {errors.email && (
              <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '6px' }}>{errors.email}</p>
            )}
          </div>

          {/* Phone number field only for customer */}
          {userType === 'customer' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '14px'
              }}>
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your WhatsApp number (e.g., +6281234567890)"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${errors.phoneNumber ? '#e53e3e' : '#e0e0e0'}`,
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  backgroundColor: '#fafafa',
                  boxSizing: 'border-box' // Prevent overflow
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.phoneNumber ? '#e53e3e' : '#e0e0e0'}
              />
              {errors.phoneNumber && (
                <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '6px' }}>{errors.phoneNumber}</p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#333',
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: `2px solid ${errors.password ? '#e53e3e' : '#e0e0e0'}`,
                fontSize: '15px',
                transition: 'all 0.3s ease',
                outline: 'none',
                backgroundColor: '#fafafa',
                boxSizing: 'border-box' // Prevent overflow
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = errors.password ? '#e53e3e' : '#e0e0e0'}
            />
            {errors.password && (
              <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '6px' }}>{errors.password}</p>
            )}
          </div>

          {/* Confirm Password only for customer signup */}
          {!isLogin && userType === 'customer' && (
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600', 
                color: '#333',
                fontSize: '14px'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: `2px solid ${errors.confirmPassword ? '#e53e3e' : '#e0e0e0'}`,
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  backgroundColor: '#fafafa',
                  boxSizing: 'border-box' // Prevent overflow
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#e53e3e' : '#e0e0e0'}
              />
              {errors.confirmPassword && (
                <p style={{ color: '#e53e3e', fontSize: '13px', marginTop: '6px' }}>{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              fontSize: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginBottom: '20px'
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
            {isLogin ? (userType === 'admin' ? 'Admin Login' : 'Sign In') : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '15px' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '15px',
                padding: '0 5px'
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}