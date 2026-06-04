const cron = require('node-cron');

// Sync inventory with suppliers every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Syncing inventory with suppliers...');
  
  // Fetch low stock products
  const lowStockProducts = await Product.find({
    stock: { $lt: 10 }
  });
  
  // Auto-order from suppliers
  for (const product of lowStockProducts) {
    await orderQueue.add('auto-restock', {
      productId: product._id,
      quantity: 100,
      supplier: product.supplier
    });
  }
});