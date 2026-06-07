/**
 * Input Sanitization Middleware
 * Prevents XSS and injection attacks
 */

const sanitizeHtml = require('sanitize-html');

/**
 * HTML sanitization options
 */
const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href']
  },
  allowedSchemes: ['http', 'https']
};

/**
 * Sanitize a single value
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove HTML tags
    let sanitized = sanitizeHtml(value, sanitizeOptions);
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    // Trim whitespace
    sanitized = sanitized.trim();
    return sanitized;
  }
  return value;
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal fields
      if (key.startsWith('_')) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  return sanitizeValue(obj);
};

/**
 * Sanitize request body, query, and params
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

module.exports = sanitizeMiddleware;