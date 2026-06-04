const app = require('./app');
const mongoose = require('mongoose');
const redisClient = require('./config/database/redis.config');
const logger = require('./config/logger/winston.config');
const { validateOpenAIConfig } = require('./config/openai.config');

const PORT = process.env.PORT || 3000;
let server;

// Graceful shutdown function
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing connections...');
  
  if (server) {
    await new Promise((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }
  
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  
  await redisClient.quit();
  logger.info('Redis connection closed');
  
  process.exit(0);
};

// Start server
const startServer = async () => {
  try {
    // Validate configurations
    validateOpenAIConfig();
    
    // Connect to databases
    await mongoose.connection;
    logger.info('Connected to MongoDB');
    
    await redisClient.connect();
    logger.info('Connected to Redis');
    
    // Start listening
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api/v1`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();