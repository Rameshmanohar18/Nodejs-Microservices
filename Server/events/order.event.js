const eventEmitter = require('./eventEmitter');
const { emailQueue } = require('../jobs/queues/email.queue');
const { orderTasks } = require('../jobs/queues/order.queue');

// Define event names
const ORDER_EVENTS = {
  CREATED: 'order.created',
  PAID: 'order.paid',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled'
};

// Listen to order.created event
eventEmitter.on(ORDER_EVENTS.CREATED, async (orderData) => {
  console.log(`Event triggered: Order ${orderData.id} created`);
  
  // Multiple actions can happen without modifying order creation code
  await emailQueue.add('order-confirmation', {
    email: orderData.userEmail,
    orderId: orderData.id
  });
  
  await orderTasks.generateInvoice(orderData.id);
  
  // Send SMS to admin
  await eventEmitter.emit('notification.sms', {
    phone: '+919876543210',
    message: `New order #${orderData.id}`
  });
});

eventEmitter.on(ORDER_EVENTS.PAID, async (orderData) => {
  // Update inventory
  await orderQueue.add('sync-inventory', {
    orderId: orderData.id,
    items: orderData.items
  });
  
  // Send payment confirmation
  await emailQueue.add('payment-confirmation', {
    email: orderData.userEmail,
    amount: orderData.amount
  });
});

// Export events
module.exports = { eventEmitter, ORDER_EVENTS };


// What it does: Decoupled communication between modules
// Use Cases:

// ✅ Order placed → trigger multiple actions

// ✅ User registered → send welcome, analytics, etc.

// ✅ Payment failed → notify user, retry, log

// ✅ Product out of stock → alert admin, update UI