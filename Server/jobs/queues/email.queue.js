//  2. JOBS Folder (Asynchronous Background Processing)
// What it does: Handles tasks that run outside the request-response cycle
// 2a. QUEUES Folder - Task Manager

const Bull = require('bull');
const redisConfig = require('../../config/redis.config');

// Create a queue for email tasks
const emailQueue = new Bull('email-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,           // Retry 3 times if fails
    backoff: 5000,         // Wait 5 seconds between retries
    removeOnComplete: true, // Auto-clean completed jobs
    removeOnFail: false     // Keep failed jobs for debugging
  }
});

// Add job to queue
const sendWelcomeEmail = async (userEmail, userName) => {
  await emailQueue.add('welcome', {
    email: userEmail,
    name: userName,
    type: 'welcome'
  });
};

// Add delayed job (send after 1 hour)
const sendReminderEmail = async (userEmail, delayMs = 3600000) => {
  await emailQueue.add('reminder', {
    email: userEmail
  }, {
    delay: delayMs  // Send after 1 hour
  });
};

module.exports = { emailQueue, sendWelcomeEmail, sendReminderEmail };