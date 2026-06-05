import { Worker } from 'bullmq';
import { sendEmail } from '../../services/communication/email.service.js';
import { redis } from '../../config/database/index.js';
import logger from '../../config/logger/winston.config.js';

const emailWorker = new Worker('email-queue', async (job) => {
  const { to, subject, template, data } = job.data;
  
  try {
    await sendEmail({ email: to, subject, template, data });
    logger.info(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}, {
  connection: redis.client,
  concurrency: 5,
});

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed:`, err);
});

export default emailWorker;