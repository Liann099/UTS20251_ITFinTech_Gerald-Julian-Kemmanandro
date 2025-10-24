// pages/api/auth/verify.js
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { userId, code } = req.body;

    console.log('Verification attempt - userId:', userId, 'code:', code); // Debug log

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found with id:', userId); // Debug log
      return res.status(400).json({ message: 'User not found' });
    }

    console.log('Stored verification code:', user.verificationCode); // Debug log
    console.log('Stored verification expiry:', user.verificationCodeExpiry); // Debug log
    console.log('Received code:', code); // Debug log
    console.log('Code match:', user.verificationCode === code); // Debug log
    console.log('Current time:', new Date()); // Debug log
    console.log('Is expired:', user.verificationCodeExpiry && user.verificationCodeExpiry < new Date()); // Debug log

    // Check if verification code exists
    if (!user.verificationCode) {
      console.log('No verification code found for user'); // Debug log
      return res.status(400).json({ message: 'No verification code found. Please sign up again.' });
    }

    // Check if verification code matches
    if (user.verificationCode !== code) {
      console.log('Verification code does not match'); // Debug log
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if verification code has expired
    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      console.log('Verification code has expired'); // Debug log
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Update user to verified status
    const result = await User.findByIdAndUpdate(userId, {
      isVerified: true,
      verificationCode: null, // Clear the verification code
      verificationCodeExpiry: null // Clear the expiry
    }, { new: true }); // Return updated document

    if (!result) {
      console.log('Failed to update user verification status'); // Debug log
      return res.status(500).json({ message: 'Failed to update verification status' });
    }

    console.log('User verified successfully'); // Debug log
    res.status(200).json({ message: 'User verified successfully' });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}