const Order = require('../../models/order.model');
const Product = require('../../models/product.model');
const InventoryService = require('./inventory.service');

class OrderService {
  // Use Case: Calculate order total with tax and discount
  async calculateOrderTotal(items, couponCode) {
    let subtotal = 0;
    
    // Calculate item prices
    for (const item of items) {
      const product = await Product.findById(item.productId);
      subtotal += product.price * item.quantity;
    }
    
    // Calculate tax (18% GST)
    const tax = subtotal * 0.18;
    
    // Apply coupon discount
    let discount = 0;
    if (couponCode === 'SAVE100') {
      discount = 100;
    }
    
    const total = subtotal + tax - discount;
    
    return {
      subtotal,
      tax,
      discount,
      total,
      savings: discount
    };
  }
  
  // Use Case: Check if order can be cancelled
  async canCancelOrder(orderId, userId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    
    if (!order) return false;
    
    // Business rule: Only cancel within 30 minutes and before shipping
    const timeElapsed = Date.now() - order.createdAt;
    const canCancel = timeElapsed < 30 * 60 * 1000 && 
                      order.status === 'Pending';
    
    return canCancel;
  }
  
  // Use Case: Process bulk orders (admin feature)
  async processBulkOrders(orderIds) {
    const results = [];
    
    for (const orderId of orderIds) {
      try {
        const order = await this.processOrder(orderId);
        results.push({ orderId, status: 'success', order });
      } catch (error) {
        results.push({ orderId, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
}

// When to use Services:

// Complex calculations ✅

// Business rule validation ✅

// Third-party API integration ✅

// Data transformation ✅

// Multi-step processes ✅