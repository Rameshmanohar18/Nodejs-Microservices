


const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');

// Use Case 1: Verify user is logged in
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;  // Attach user to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Use Case 2: Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'You do not have permission to access this resource' 
      });
    }
    next();
  };
};

// Use Case 3: Rate limiting per user
const rateLimit = new Map(); // In production, use Redis

const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!rateLimit.has(userId)) {
      rateLimit.set(userId, []);
    }
    
    const userRequests = rateLimit.get(userId);
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: `Too many requests. Limit: ${maxRequests} per minute` 
      });
    }
    
    validRequests.push(now);
    rateLimit.set(userId, validRequests);
    next();
  };
};

module.exports = { authenticate, authorize, userRateLimit };








// MIDDLEWARE Folder - Request Interceptors
// What it does: Functions that run before/after controllers
// Use Cases:

// ✅ Authentication (JWT verification)

// ✅ Logging all requests

// ✅ Rate limiting

// ✅ Input sanitization

// ✅ CORS handling

// ✅ Error handling

// When to use Middleware:

// Every request needs this logic ✅

// Reusable across multiple routes ✅

// Cross-cutting concerns (logging, auth) ✅


// Example: src/middleware/auth/auth.middleware.js