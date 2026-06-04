const { orderProcessingQueue } = require('../queues/order.queue');
const Order = require('../../models/order.model');

orderProcessingQueue.process('process', async (job) => {
  const { orderId, items, userId } = job.data;
  
  // Simulate heavy processing
  console.log(`Processing order ${orderId}`);
  
  // Task 1: Check inventory (2 seconds)
  await checkInventory(items);
  
  // Task 2: Process payment (3 seconds)
  await processPayment(orderId);
  
  // Task 3: Generate invoice PDF (2 seconds)
  await generateInvoice(orderId);
  
  // Task 4: Send confirmation email (1 second)
  await sendConfirmationEmail(userId, orderId);
  
  return { success: true, orderId };
});

async function checkInventory(items) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('✅ Inventory checked');
}

async function processPayment(orderId) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✅ Payment processed');
}

async function generateInvoice(orderId) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('✅ Invoice generated');
}

async function sendConfirmationEmail(userId, orderId) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ Email sent');
}