
/**
 * CORS Security Configuration
 * Controls cross-origin resource sharing
 */

const allowedOrigins = (() => {
  const origins = process.env.CORS_ORIGINS || '';
  return origins.split(',').filter(Boolean);
})();

// Allowed origins based on environment
const getAllowedOrigins = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const origins = [
    ...allowedOrigins,
    'https://www.flipkart-clone.com',
    'https://flipkart-clone.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080'
  ];
  
  if (isDevelopment) {
    origins.push('http://localhost:*');
    origins.push('http://127.0.0.1:*');
  }
  
  if (isProduction) {
    origins.push('https://*.flipkart-clone.com');
  }
  
  return [...new Set(origins)]; // Remove duplicates
};

// CORS options
const corsOptions = {
  // Allow specific origins
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  
  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token',
    'X-API-Key'
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  // Max age of preflight request (24 hours)
  maxAge: 86400,
  
  // Preflight status code
  optionsSuccessStatus: 204,
  
  // Enable preflight requests
  preflightContinue: false
};

// Dynamic CORS configuration for specific routes
const routeSpecificCors = {
  // Public APIs (more permissive)
  public: {
    ...corsOptions,
    credentials: false,
    origin: '*'
  },
  
  // Admin APIs (stricter)
  admin: {
    ...corsOptions,
    origin: getAllowedOrigins(),
    credentials: true
  },
  
  // Webhook endpoints (specific origins)
  webhook: {
    origin: [
      'https://api.razorpay.com',
      'https://webhook.sendgrid.com'
    ],
    methods: ['POST'],
    credentials: false
  },
  
  // CDN/Assets (most permissive)
  assets: {
    origin: '*',
    methods: ['GET', 'HEAD'],
    credentials: false,
    maxAge: 86400
  }
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message.includes('not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: err.message
      }
    });
  }
  next(err);
};

module.exports = {
  corsOptions,
  routeSpecificCors,
  corsErrorHandler,
  getAllowedOrigins
};