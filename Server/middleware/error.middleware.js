

/**
 * Global Error Handling Middleware
 * Centralized error handling for the application
 */

const logger = require('../config/logger/winston.config');

// Error types and their HTTP status codes
const ERROR_STATUS_MAP = {
  'ValidationError': 400,
  'CastError': 400,
  'MongoError': 400,
  'JsonWebTokenError': 401,
  'TokenExpiredError': 401,
  'UnauthorizedError': 401,
  'ForbiddenError': 403,
  'NotFoundError': 404,
  'ConflictError': 409,
  'RateLimitError': 429,
  'InternalError': 500
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id
  });
  
  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  if (ERROR_STATUS_MAP[err.name]) {
    statusCode = ERROR_STATUS_MAP[err.name];
  }
  
  // Format error response
  const errorResponse = {
    success: false,
    error: {
      code: err.code || err.name || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };
  
  // Add validation details if available
  if (err.name === 'ValidationError' && err.errors) {
    errorResponse.error.details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Async wrapper for route handlers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.constructor.name;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  catchAsync,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
};