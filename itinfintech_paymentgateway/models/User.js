// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Keep email unique
    lowercase: true
  },
  phoneNumber: { // No 'unique: true' here
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['customer', 'admin']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String, // Or define as needed
  verificationCodeExpiry: Date, // Or define as needed
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);