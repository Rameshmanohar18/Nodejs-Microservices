// import mongoose from 'mongoose';
// import { v4 as uuidv4 } from 'uuid';

// const orderItemSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true,
//   },
//   name: String,
//   image: String,
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1,
//   },
//   price: Number,
//   discount: Number,
//   finalPrice: Number,
//   seller: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
//     default: 'pending',
//   },
//   tracking: {
//     provider: String,
//     trackingNumber: String,
//     url: String,
//   },
//   cancellationReason: String,
//   returnReason: String,
// });

// const paymentDetailsSchema = new mongoose.Schema({
//   method: {
//     type: String,
//     enum: ['razorpay', 'cod', 'card', 'upi', 'netbanking'],
//     required: true,
//   },
//   razorpayOrderId: String,
//   razorpayPaymentId: String,
//   razorpaySignature: String,
//   amount: Number,
//   status: {
//     type: String,
//     enum: ['pending', 'success', 'failed', 'refunded'],
//     default: 'pending',
//   },
//   paidAt: Date,
//   refundAmount: Number,
//   refundId: String,
// });

// const orderSchema = new mongoose.Schema({
//   orderId: {
//     type: String,
//     unique: true,
//     default: () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   items: [orderItemSchema],
//   shippingAddress: {
//     name: String,
//     phone: String,
//     address: String,
//     city: String,
//     state: String,
//     pincode: String,
//     landmark: String,
//     addressType: String,
//   },
//   billingAddress: {
//     name: String,
//     phone: String,
//     address: String,
//     city: String,
//     state: String,
//     pincode: String,
//   },
//   payment: paymentDetailsSchema,
//   subtotal: {
//     type: Number,
//     required: true,
//   },
//   discount: {
//     type: Number,
//     default: 0,
//   },
//   coupon: {
//     code: String,
//     discount: Number,
//   },
//   shippingCharge: {
//     type: Number,
//     default: 0,
//   },
//   tax: {
//     type: Number,
//     default: 0,
//   },
//   total: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'],
//     default: 'pending',
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded'],
//     default: 'pending',
//   },
//   orderStatusHistory: [{
//     status: String,
//     comment: String,
//     updatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//     },
//     timestamp: {
//       type: Date,
//       default: Date.now,
//     },
//   }],
//   deliveredAt: Date,
//   cancelledAt: Date,
//   cancellationReason: String,
//   expectedDeliveryDate: Date,
//   invoiceUrl: String,
//   notes: String,
// }, {
//   timestamps: true,
// });

// // Update status history
// orderSchema.methods.updateStatus = async function(status, comment = '', userId = null) {
//   this.status = status;
//   this.orderStatusHistory.push({
//     status,
//     comment,
//     updatedBy: userId,
//     timestamp: new Date(),
//   });
  
//   if (status === 'delivered') {
//     this.deliveredAt = new Date();
//   } else if (status === 'cancelled') {
//     this.cancelledAt = new Date();
//   }
  
//   await this.save();
// };

// const Order = mongoose.model('Order', orderSchema);

// export default Order;


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