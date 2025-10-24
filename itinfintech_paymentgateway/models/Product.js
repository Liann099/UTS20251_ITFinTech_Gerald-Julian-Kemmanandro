// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: '/public' // Default image if none provided
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);