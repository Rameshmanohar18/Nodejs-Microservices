/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/database/redis.config');

// General rate limiter (100 requests per minute)
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:',
    resetExpiryOnChange: true
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  }
});

// Strict rate limiter for auth endpoints (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
    resetExpiryOnChange: true
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    }
  },
  keyGenerator: (req) => req.body.email || req.ip
});

// API rate limiter (1000 requests per minute for authenticated users)
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',
    resetExpiryOnChange: true
  }),
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => !req.user // Only apply to authenticated users
});

// Admin rate limiter (stricter limits for admin endpoints)
const adminLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:admin:',
    resetExpiryOnChange: true
  }),
  windowMs: 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.user?.id,
  skip: (req) => req.user?.role !== 'admin'
});

// Order rate limiter (prevent spam orders)
const orderLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:order:',
    resetExpiryOnChange: true
  }),
  windowMs: 60 * 1000,
  max: 10, // Max 10 orders per minute
  keyGenerator: (req) => req.user?.id,
  message: {
    success: false,
    error: {
      code: 'ORDER_LIMIT_EXCEEDED',
      message: 'You are placing orders too quickly. Please slow down.'
    }
  }
});

// Search rate limiter (prevent scraping)
const searchLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:search:',
    resetExpiryOnChange: true
  }),
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    error: {
      code: 'SEARCH_LIMIT_EXCEEDED',
      message: 'Too many search requests. Please wait a moment.'
    }
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  adminLimiter,
  orderLimiter,
  searchLimiter
};