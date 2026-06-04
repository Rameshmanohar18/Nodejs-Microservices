const mongoose = require('mongoose');
const { orderStatus, paymentStatus } = require('../utils/constants/enums');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: Number
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: Number,
  shipping: Number,
  discount: Number,
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(orderStatus),
    default: orderStatus.PENDING,
    index: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(paymentStatus),
    default: paymentStatus.PENDING
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Card', 'UPI', 'NetBanking'],
    required: true
  },
  paymentDetails: {
    paymentId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String
  },
  trackingId: String,
  deliveredAt: Date,
  cancelledAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ orderId: 1 });

// Pre-save middleware
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
  }
  next();
});

// Instance methods
orderSchema.methods.isCancellable = function() {
  return [orderStatus.PENDING, orderStatus.CONFIRMED].includes(this.status);
};

// Static methods
orderSchema.statics.getUserOrders = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Order', orderSchema);