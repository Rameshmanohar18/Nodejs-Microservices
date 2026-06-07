/**
 * Logging Middleware
 * Comprehensive request/response logging
 */

const morgan = require('morgan');
const logger = require('../config/logger/winston.config');

/**
 * Custom Morgan token for request ID
 */
morgan.token('id', (req) => req.id);
morgan.token('userId', (req) => req.user?._id || 'anonymous');
morgan.token('responseTime', (req, res) => {
  if (!req._startAt || !res._startAt) return '';
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) / 1e6;
  return ms.toFixed(3);
});

/**
 * JSON format for structured logging
 */
const jsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId: tokens.id(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens.responseTime(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    userAgent: tokens['user-agent'](req, res),
    ip: tokens['remote-addr'](req, res),
    userId: tokens.userId(req, res),
    referrer: tokens.referrer(req, res)
  });
};

/**
 * Morgan stream for Winston
 */
const stream = {
  write: (message) => {
    try {
      const data = JSON.parse(message);
      logger.info('HTTP Request', data);
    } catch {
      logger.info(message.trim());
    }
  }
};

/**
 * Production logging middleware
 */
const productionLogger = morgan(jsonFormat, { stream });

/**
 * Development logging middleware (colored console)
 */
const developmentLogger = morgan('dev');

/**
 * Choose logger based on environment
 */
const loggingMiddleware = process.env.NODE_ENV === 'production' 
  ? productionLogger 
  : developmentLogger;

module.exports = loggingMiddleware;