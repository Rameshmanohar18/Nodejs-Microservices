const rateLimit = require('express-rate-limit');

// Stricter rate limits for AI endpoints (cost control)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Even stricter for free tier users
const freeTierRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  skip: (req) => req.user?.subscriptionTier === 'premium',
  message: {
    success: false,
    message: 'Free tier limit reached. Upgrade for more AI requests.'
  }
});

module.exports = {
  aiRateLimiter,
  freeTierRateLimiter,
};