// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  external_id: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  items: [
    {
      productId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
  status: {
  type: String,
  enum: ['pending', 'paid', 'failed', 'PENDING', 'PAID', 'FAILED'],
  default: 'pending'
},

  customer_name: {
    type: String,
    required: true,
  },
  customer_email: {
    type: String,
    required: true,
  },
  customer_phone: {
    type: String,
    required: false,
  },
  shipping_address: {
    country: String,
    address: String,
    town: String,
    state: String,
    postcode: String,
  },
  xendit_invoice_url: {
    type: String,
  },
  payment_method: {
    type: String,
  },
  paid_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at timestamp before saving
orderSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);