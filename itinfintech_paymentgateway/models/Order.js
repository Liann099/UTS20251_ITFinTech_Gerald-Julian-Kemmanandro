import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  external_id: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  status: {
    type: String,
    default: 'PENDING',
    enum: ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  // Payment details (filled when payment is successful)
  paid_at: {
    type: Date
  },
  paid_amount: {
    type: Number
  },
  payment_method: {
    type: String
  },
  payment_channel: {
    type: String
  },
  payment_destination: {
    type: String
  },
  // Xendit invoice details
  xendit_invoice_id: {
    type: String
  },
  xendit_invoice_url: {
    type: String
  },
  // Customer details
  customer_email: {
    type: String
  },
  customer_name: {
    type: String
  },
  description: {
    type: String
  }
});

// Update the updated_at field before saving
orderSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);