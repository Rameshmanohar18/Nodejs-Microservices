const { emailQueue } = require('../queues/email.queue');
const EmailService = require('../../services/email.service');

// Worker processes jobs from queue
emailQueue.process('welcome', async (job) => {
  console.log(`Processing welcome email for ${job.data.email}`);
  
  try {
    // Actually send the email (this takes time)
    await EmailService.sendEmailImmediately(
      job.data.email,
      'Welcome to Flipkart!',
      `Hello ${job.data.name}, welcome!`
    );
    
    console.log(`Email sent successfully to ${job.data.email}`);
    return { success: true };
    
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
    throw error; // Will trigger retry mechanism
  }
});

emailQueue.process('reminder', async (job) => {
  await EmailService.sendEmailImmediately(
    job.data.email,
    'Reminder: Complete your purchase',
    'You have items in your cart!'
  );
});

// Monitor queue events
emailQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

module.exports = emailQueue;