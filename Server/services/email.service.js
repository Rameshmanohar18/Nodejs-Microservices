const nodemailer = require('nodemailer');

class EmailService {
  // This function sends email IMMEDIATELY (blocks user)
  sendEmailImmediately(to, subject, body) {
    // User will wait for this to complete ❌ Bad for performance
    const transporter = nodemailer.createTransport({...});
    return transporter.sendMail({to, subject, html: body});
  }
  
  // This function PREPARES email but doesn't send (returns job ID)
  queueEmailForSending(to, subject, body) {
    // Just creates a job, doesn't actually send ✅ Good for performance
    return emailQueue.add('send-email', { to, subject, body });
  }
}

// Business logic service
class OrderService {
  async createOrder(orderData) {
    // 1. Save order to database (fast)
    const order = await Order.create(orderData);
    
    // 2. Update inventory (fast)
    await InventoryService.updateStock(orderData.items);
    
    // 3. Queue email (doesn't wait for actual sending)
    await EmailService.queueEmailForSending(
      order.user.email,
      'Order Confirmed',
      `Your order #${order.id} is confirmed`
    );
    
    // 4. Return response immediately (email sends in background)
    return order;
  }
}

// When to use Services:

// ✅ User registration (save to DB, return token)

// ✅ Calculate cart total

// ✅ Validate coupon code

// ✅ Process payment (synchronous gateways)

// ✅ Check product stock