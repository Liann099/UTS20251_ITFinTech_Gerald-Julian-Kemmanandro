// pages/api/auth/signup.js
import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import { sendWhatsAppVerification } from '../../../lib/twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { email, phoneNumber, password, name, userType } = req.body;

    // Validate input
    if (!email || !phoneNumber || !password || !name || !userType) {
      return res.status(400).json({ 
        message: 'All fields are required: email, phoneNumber, password, name, userType' 
      });
    }

    // Check if user already exists with this email only
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a random 6-digit verification code (as string)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log('Generated verification code:', verificationCode); // Debug log

    // Create new user with verification code and expiry
    const userData = {
      email,
      phoneNumber,
      password: hashedPassword,
      name,
      userType,
      isVerified: false,
      verificationCode: verificationCode, // Explicitly set
      verificationCodeExpiry: verificationCodeExpiry // Explicitly set
    };

    const user = await User.create(userData);

    // Verify that the user was created with the verification fields
    const createdUser = await User.findById(user._id);
    console.log('User document after creation:', {
      id: createdUser._id,
      verificationCode: createdUser.verificationCode,
      verificationCodeExpiry: createdUser.verificationCodeExpiry
    });

    // Send verification code via WhatsApp
    try {
      await sendWhatsAppVerification(phoneNumber, verificationCode);
      console.log(`Verification code sent to ${phoneNumber} via WhatsApp`);
    } catch (twilioError) {
      console.error('Failed to send verification code:', twilioError);
      // If sending fails, delete the user and return an error
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
    }

    res.status(201).json({ 
      message: 'User created successfully. Verification code sent to your WhatsApp.', 
      userId: user._id 
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}