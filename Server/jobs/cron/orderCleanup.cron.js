const cron = require('node-cron');
const Order = require('../../models/order.model');
const logger = require('../../config/logger');

// Runs every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting order cleanup job...');
  
  // Find orders pending for more than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const cancelledOrders = await Order.updateMany(
    {
      status: 'Pending',
      createdAt: { $lt: sevenDaysAgo }
    },
    {
      status: 'Cancelled',
      cancelledAt: new Date(),
      cancellationReason: 'Auto-cancelled: Payment timeout'
    }
  );
  
  logger.info(`Auto-cancelled ${cancelledOrders.modifiedCount} orders`);
});

// Runs every hour
cron.schedule('0 * * * *', async () => {
  // Send abandoned cart reminders
  const abandonedCarts = await Cart.find({
    updatedAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } // 2 hours old
  });
  
  for (const cart of abandonedCarts) {
    await emailQueue.add('cart-reminder', {
      email: cart.user.email,
      items: cart.items
    });
  }
});