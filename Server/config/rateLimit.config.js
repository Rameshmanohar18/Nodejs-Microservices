
/**
 * Rate Limit Configuration
 * Comprehensive rate limiting for all API endpoints
 * Uses Redis for distributed rate limiting
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('./database/redis.config');
const logger = require('./logger/winston.config');

// ==================== CUSTOM KEY GENERATORS ====================

/**
 * Generate custom rate limit key based on user ID or IP
 */
const getKey = (req) => {
  // Use user ID if authenticated, otherwise IP
  if (req.user && req.user._id) {
    return `user:${req.user._id}`;
  }
  // Use IP for unauthenticated requests
  return `ip:${req.ip}`;
};

/**
 * Generate key based on user role
 */
const getRoleBasedKey = (req) => {
  if (req.user) {
    return `role:${req.user.role}:${req.user._id}`;
  }
  return `ip:${req.ip}`;
};

/**
 * Generate key for API endpoint specific limiting
 */
const getEndpointKey = (req) => {
  const userPrefix = req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
  const endpoint = req.route?.path || req.path;
  return `${userPrefix}:${req.method}:${endpoint}`;
};

/**
 * Generate key for dynamic rate limiting based on user tier
 */
const getTierBasedKey = (req) => {
  const tier = req.user?.subscriptionTier || 'free';
  return `tier:${tier}:${req.user?._id || req.ip}`;
};

// ==================== SKIP CONDITIONS ====================

/**
 * Skip rate limiting for internal health checks
 */
const skipHealthChecks = (req) => {
  return req.path === '/health' || req.path === '/metrics' || req.path === '/ready';
};

/**
 * Skip rate limiting for whitelisted IPs (admin/internal)
 */
const skipWhitelistedIPs = (req) => {
  const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
  return whitelist.includes(req.ip);
};

/**
 * Skip rate limiting in development environment
 */
const skipDevelopment = (req) => {
  return process.env.NODE_ENV === 'development';
};

// ==================== HANDLERS ====================

/**
 * Custom handler when rate limit is exceeded
 */
const onLimitReached = (req, res, options) => {
  const key = getKey(req);
  
  logger.warn(`Rate limit exceeded`, {
    ip: req.ip,
    userId: req.user?._id,
    path: req.path,
    method: req.method,
    key: key,
    limit: options.max,
    windowMs: options.windowMs
  });

  // Track for security monitoring
  if (global.auditLogger) {
    global.auditLogger.securityAlert({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      details: {
        ip: req.ip,
        userId: req.user?._id,
        path: req.path,
        limit: options.max
      }
    }, req);
  }
};

/**
 * Custom handler for rate limit exceeded response
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining,
      resetTime: new Date(req.rateLimit.resetTime).toISOString()
    }
  });
};

// ==================== STORE CONFIGURATION ====================

/**
 * Redis store configuration for distributed rate limiting
 */
const createRedisStore = (prefix) => {
  return new RedisStore({
    client: redisClient,
    prefix: `rl:${prefix}:`,
    resetExpiryOnChange: true,
    sendCommand: (...args) => redisClient.call(...args)
  });
};

// ==================== RATE LIMIT CONFIGURATIONS ====================

/**
 * 1. GLOBAL RATE LIMITER
 * Applies to all requests
 */
const globalLimiter = rateLimit({
  store: createRedisStore('global'),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: getKey,
  skip: (req) => skipHealthChecks(req) || skipWhitelistedIPs(req) || skipDevelopment(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * 2. AUTHENTICATION RATE LIMITER
 * Stricter limits for auth endpoints (prevent brute force)
 */
const authLimiter = rateLimit({
  store: createRedisStore('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => req.body.email || req.ip,
  skip: (req) => skipWhitelistedIPs(req) || skipDevelopment(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false
});

/**
 * 3. API RATE LIMITER
 * For authenticated API users
 */
const apiLimiter = rateLimit({
  store: createRedisStore('api'),
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for authenticated users
  keyGenerator: getKey,
  skip: (req) => !req.user || skipHealthChecks(req) || skipWhitelistedIPs(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 4. ADMIN RATE LIMITER
 * Stricter limits for admin endpoints
 */
const adminLimiter = rateLimit({
  store: createRedisStore('admin'),
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute for admin
  keyGenerator: getRoleBasedKey,
  skip: (req) => req.user?.role !== 'admin' || skipWhitelistedIPs(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 5. ORDER RATE LIMITER
 * Prevent order spam
 */
const orderLimiter = rateLimit({
  store: createRedisStore('order'),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 orders per minute
  keyGenerator: getKey,
  skip: (req) => !req.user,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 6. SEARCH RATE LIMITER
 * Prevent scraping via search
 */
const searchLimiter = rateLimit({
  store: createRedisStore('search'),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  keyGenerator: getKey,
  skip: (req) => skipHealthChecks(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 7. PAYMENT RATE LIMITER
 * Stricter limits for payment endpoints
 */
const paymentLimiter = rateLimit({
  store: createRedisStore('payment'),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 payment attempts per minute
  keyGenerator: getKey,
  skip: (req) => !req.user,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 8. LOGIN RATE LIMITER (IP based)
 * Prevent brute force attacks across different accounts
 */
const loginLimiter = rateLimit({
  store: createRedisStore('login'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per IP per 15 minutes
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached,
  skipSuccessfulRequests: true
});

/**
 * 9. REGISTRATION RATE LIMITER
 * Prevent spam account creation
 */
const registrationLimiter = rateLimit({
  store: createRedisStore('registration'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 10. PASSWORD RESET RATE LIMITER
 * Prevent abuse of password reset functionality
 */
const passwordResetLimiter = rateLimit({
  store: createRedisStore('password-reset'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  keyGenerator: (req) => req.body.email || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 11. REFRESH TOKEN RATE LIMITER
 * Prevent token abuse
 */
const refreshTokenLimiter = rateLimit({
  store: createRedisStore('refresh'),
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 refresh requests per minute
  keyGenerator: getKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 12. WEBHOOK RATE LIMITER
 * Different limits for webhook endpoints (based on source IP)
 */
const webhookLimiter = rateLimit({
  store: createRedisStore('webhook'),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhook calls per minute (higher limit)
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 13. TIER-BASED RATE LIMITER
 * Different limits based on user subscription tier
 */
const tierBasedLimiter = rateLimit({
  store: createRedisStore('tier'),
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    const tier = req.user?.subscriptionTier || 'free';
    const limits = {
      free: 50,
      basic: 200,
      premium: 500,
      enterprise: 1000
    };
    return limits[tier] || 50;
  },
  keyGenerator: getTierBasedKey,
  skip: (req) => !req.user,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

/**
 * 14. ENDPOINT SPECIFIC RATE LIMITER
 * Custom limits for specific endpoints
 */
const createEndpointLimiter = (endpoint, max, windowMs = 60000) => {
  return rateLimit({
    store: createRedisStore(`endpoint:${endpoint}`),
    windowMs,
    max,
    keyGenerator: getEndpointKey,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    onLimitReached: onLimitReached,
    skip: (req) => req.path !== endpoint
  });
};

/**
 * 15. BURST RATE LIMITER (Sliding Window)
 * Allows short bursts but limits long-term average
 */
const burstLimiter = rateLimit({
  store: createRedisStore('burst'),
  windowMs: 10 * 1000, // 10 seconds
  max: 20, // 20 requests per 10 seconds (burst)
  keyGenerator: getKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  onLimitReached: onLimitReached
});

// ==================== DYNAMIC RATE LIMITER ====================

/**
 * Dynamic rate limiter based on current system load
 */
class DynamicRateLimiter {
  constructor() {
    this.baseLimits = {
      normal: 100,
      high: 50,
      critical: 25
    };
    this.currentState = 'normal';
  }

  /**
   * Check system load and adjust limits
   */
  async getCurrentLimit() {
    // This would check CPU/Memory usage and adjust
    // For now, return based on time of day
    const hour = new Date().getHours();
    
    if (hour >= 10 && hour <= 22) {
      // Peak hours (10 AM to 10 PM)
      return this.baseLimits.high;
    } else if (hour >= 1 && hour <= 5) {
      // Off-peak hours (1 AM to 5 AM)
      return this.baseLimits.critical;
    }
    
    return this.baseLimits.normal;
  }

  getMiddleware() {
    return rateLimit({
      store: createRedisStore('dynamic'),
      windowMs: 60 * 1000,
      max: async (req) => {
        return await this.getCurrentLimit();
      },
      keyGenerator: getKey,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler,
      onLimitReached: onLimitReached
    });
  }
}

const dynamicLimiter = new DynamicRateLimiter();

// ==================== RATE LIMIT MIDDLEWARE COMPOSER ====================

/**
 * Compose multiple rate limiters
 */
const composeRateLimiters = (...limiters) => {
  return async (req, res, next) => {
    let index = 0;
    
    const runNext = async () => {
      if (index >= limiters.length) {
        return next();
      }
      
      const limiter = limiters[index++];
      limiter(req, res, runNext);
    };
    
    runNext();
  };
};

// ==================== EXPORTS ====================

module.exports = {
  // Individual limiters
  globalLimiter,
  authLimiter,
  apiLimiter,
  adminLimiter,
  orderLimiter,
  searchLimiter,
  paymentLimiter,
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
  webhookLimiter,
  tierBasedLimiter,
  burstLimiter,
  dynamicLimiter: dynamicLimiter.getMiddleware(),
  
  // Helper functions
  createEndpointLimiter,
  composeRateLimiters,
  
  // Utility functions
  getKey,
  getRoleBasedKey,
  getEndpointKey,
  getTierBasedKey,
  
  // Common pre-configured endpoint limiters
  productLimiter: createEndpointLimiter('/api/v1/products', 200),
  cartLimiter: createEndpointLimiter('/api/v1/cart', 100),
  reviewLimiter: createEndpointLimiter('/api/v1/reviews', 50, 15 * 60 * 1000), // 50 per 15 min
  wishlistLimiter: createEndpointLimiter('/api/v1/wishlist', 100),
  
  // Composed limiters for specific use cases
  strictAuthLimiter: composeRateLimiters(loginLimiter, authLimiter),
  apiWithBurstLimiter: composeRateLimiters(burstLimiter, apiLimiter),
  adminWithStrictLimiter: composeRateLimiters(adminLimiter, globalLimiter)
};