/**
 * Request ID Middleware
 * Assigns unique ID to each request for tracing
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate and attach request ID
 */
const requestIdMiddleware = (req, res, next) => {
  // Get existing ID from header or generate new one
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Attach to request object
  req.id = requestId;
  
  // Set response header
  res.setHeader('X-Request-ID', requestId);
  
  // Add to response for client-side debugging
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

/**
 * Request ID logging helper
 */
const getRequestId = (req) => req.id || 'no-id';

module.exports = {
  requestIdMiddleware,
  getRequestId
};