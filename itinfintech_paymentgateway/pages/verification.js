// pages/verification.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PhoneVerification() {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const router = useRouter();
  
  // Get user data from localStorage
  const userData = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('userData') || '{}') 
    : {};
  
  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle input change for verification code
  const handleInputChange = (index, value) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Move to next input if value is entered
      if (value && index < 5) {
        document.getElementById(`code-input-${index + 1}`)?.focus();
      }
    }
  };

  // Handle backspace to move to previous input
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`)?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const enteredCode = verificationCode.join('');
    
    if (enteredCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }
    
    try {
      // Send the verification code to your backend
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.userId,
          code: enteredCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store verification status
        localStorage.setItem('isVerified', 'true');
        
        // Redirect based on user type
        if (userData.userType === 'admin') {
          router.push('/landingadmin');
        } else {
          router.push('/landingcustomer');
        }
      } else {
        alert(data.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Resend verification code
  const handleResend = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.userId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('New verification code sent to your WhatsApp!');
        setCountdown(60);
        setResendDisabled(true);
      } else {
        alert(data.message || 'Failed to resend verification code. Please try again.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      alert('An error occurred while resending the code. Please try again.');
    }
  };

  // Redirect if already verified
  useEffect(() => {
    const isVerified = localStorage.getItem('isVerified');
    if (isVerified === 'true') {
      if (userData.userType === 'admin') {
        router.push('/landingadmin');
      } else {
        router.push('/landingcustomer');
      }
    }
  }, [router, userData.userType]);

  return (
    <div style={{ 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
      padding: '20px', 
      backgroundColor: '#fafafa', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Head>
        <title>Phone Verification</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '40px',
        width: '450px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '90%',
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
            Verify Your Phone
          </h1>
          <p style={{ color: '#666', fontSize: '15px' }}>
            We've sent a 6-digit code to <strong>{userData.phoneNumber || 'your phone number'}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '16px', 
              fontWeight: '600', 
              color: '#333',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              Enter Verification Code
            </label>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: '50px',
                    height: '60px',
                    fontSize: '24px',
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#fafafa',
                    fontWeight: '600',
                    color: '#2d3748',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>
            
            <p style={{ 
              textAlign: 'center', 
              color: '#718096', 
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              The code will expire in 10 minutes
            </p>
          </div>

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
            Verify Phone
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            style={{
              padding: '10px 20px',
              background: resendDisabled 
                ? '#e2e8f0' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: resendDisabled ? '#a0aec0' : '#fff',
              border: 'none',
              borderRadius: '30px',
              cursor: resendDisabled ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            {resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}