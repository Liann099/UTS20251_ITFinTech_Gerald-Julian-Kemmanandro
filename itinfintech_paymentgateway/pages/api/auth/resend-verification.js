// pages/api/auth/resend-verification.js
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import { sendWhatsAppVerification } from '../../../lib/twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { userId } = req.body;

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate a new verification code
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with new verification code and expiry
    await User.findByIdAndUpdate(userId, {
      verificationCode: newVerificationCode,
      verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    });

    // Send new verification code via WhatsApp
    try {
      await sendWhatsAppVerification(user.phoneNumber, newVerificationCode);
      console.log(`New verification code sent to ${user.phoneNumber} via WhatsApp`);
    } catch (twilioError) {
      console.error('Failed to resend verification code:', twilioError);
      return res.status(500).json({ message: 'Failed to resend verification code. Please try again.' });
    }

    res.status(200).json({ message: 'New verification code sent to your WhatsApp' });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}