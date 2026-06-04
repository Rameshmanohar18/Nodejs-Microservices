const { orderQueue } = require('../queues/order.queue');
const Product = require('../../models/product.model');

orderQueue.process('sync-inventory', async (job) => {
  const { items } = job.data;
  
  // Process each item (this could be slow with multiple warehouses)
  for (const item of items) {
    // Update main warehouse
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity }
    });
    
    // Update regional warehouse (slow API call)
    await updateRegionalWarehouse(item.productId, item.quantity);
    
    // Log to inventory service
    await createInventoryLog(item);
  }
  
  return { synced: true };
});

async function updateRegionalWarehouse(productId, quantity) {
  // Simulate slow API call to warehouse system
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true;
}