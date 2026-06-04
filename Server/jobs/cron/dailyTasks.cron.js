const cron = require('node-cron');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('🏃 Running daily cleanup tasks...');
  
  // Delete unverified users older than 7 days
  await User.deleteMany({
    isVerified: false,
    createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  
  // Archive old orders (>1 year)
  await Order.updateMany(
    { createdAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
    { status: 'archived' }
  );
  
  console.log('✅ Daily tasks completed');
});

// When to use Jobs:

// Tasks taking >100ms ✅

// Not needed for immediate response ✅

// Can be retried if fails ✅

// CPU or I/O intensive ✅