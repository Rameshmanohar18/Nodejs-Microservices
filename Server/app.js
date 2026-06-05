import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDatabases } from './config/database/index.js';
import morganMiddleware from './config/logger/morgan.config.js';
import { errorHandler, notFound } from './middleware/error/error.middleware.js';
import routes from './routes/v1/index.js';
import corsOptions from './config/cors.config.js';
import { limiter } from './config/rateLimit.config.js';
import { initializeSocket } from './sockets/socketServer.js';
import { eventEmitter } from './events/eventEmitter.js';
import logger from './config/logger/winston.config.js';

const app = express();

// Connect to databases
await connectDatabases();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morganMiddleware);

// Rate limiting
app.use('/api', limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize socket.io
const server = initializeSocket(app);

// Event handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default app;