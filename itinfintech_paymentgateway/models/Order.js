import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  external_id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  status: {
    type: String,
    default: 'PENDING',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'orders' }); 

export default mongoose.models.Order || mongoose.model('Order', orderSchema);