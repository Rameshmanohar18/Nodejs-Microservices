const Bull = require('bull');

const orderQueue = new Bull('order-queue', {
  redis: { host: 'localhost', port: 6379 }
});

// Tasks that can be queued
const orderTasks = {
  // Generate invoice PDF (takes 2-3 seconds)
  generateInvoice: async (orderId) => {
    await orderQueue.add('generate-invoice', { orderId });
  },
  
  // Update inventory across multiple warehouses (takes 5 seconds)
  syncInventory: async (orderId, items) => {
    await orderQueue.add('sync-inventory', { orderId, items });
  },
  
  // Send SMS notifications
  sendOrderUpdate: async (phoneNumber, orderStatus) => {
    await orderQueue.add('send-sms', { phoneNumber, orderStatus });
  }
};

module.exports = { orderQueue, orderTasks };
// 



const Bull = require('bull');

const orderQueue = new Bull('order-queue', {
  redis: { host: 'localhost', port: 6379 }
});

// Tasks that can be queued
const orderTasks = {
  // Generate invoice PDF (takes 2-3 seconds)
  generateInvoice: async (orderId) => {
    await orderQueue.add('generate-invoice', { orderId });
  },
  
  // Update inventory across multiple warehouses (takes 5 seconds)
  syncInventory: async (orderId, items) => {
    await orderQueue.add('sync-inventory', { orderId, items });
  },
  
  // Send SMS notifications
  sendOrderUpdate: async (phoneNumber, orderStatus) => {
    await orderQueue.add('send-sms', { phoneNumber, orderStatus });
  }
};

module.exports = { orderQueue, orderTasks };

//  JOBS Folder (QUEUES + WORKERS + CRON)
// What it does: Background processing for slow tasks
// Use Cases:

// ✅ Send emails (slow, 2 seconds)

// ✅ Generate PDFs (CPU intensive)

// ✅ Process image uploads

// ✅ Sync with external APIs

// ✅ Daily cleanup tasks

// Example: Complete job for order processing