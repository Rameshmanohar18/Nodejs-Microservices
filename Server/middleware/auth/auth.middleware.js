/**
 * Authentication Middleware
 * Handles JWT verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../../models/user.model');
const redisClient = require('../../config/database/redis.config');
const logger = require('../../config/logger/winston.config');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You are not logged in. Please log in to access this resource.'
        }
      });
    }

    // 2. Check if token is blacklisted (logged out)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token has been invalidated. Please log in again.'
        }
      });
    }

    // 3. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 4. Check if user still exists
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user belonging to this token no longer exists.'
        }
      });
    }

    // 5. Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact support.'
        }
      });
    }

    // 6. Check if password changed after token was issued
    if (currentUser.passwordChangedAt && decoded.iat < currentUser.passwordChangedAt.getTime() / 1000) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGED',
          message: 'Your password has been changed recently. Please log in again.'
        }
      });
    }

    // 7. Attach user to request
    req.user = currentUser;
    req.userId = currentUser._id;
    req.token = token;

    // Log authentication success (for audit)
    logger.debug(`User ${currentUser.email} authenticated successfully`);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token. Please log in again.'
        }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.'
        }
      });
    }

    logger.error('Authentication error:', error);
    next(error);
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch (error) {
    // Optional auth doesn't fail on token errors
    next();
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    // Verify refresh token
    const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token'
        }
      });
    }

    req.userId = decoded.id;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token expired. Please log in again.'
        }
      });
    }

    next(error);
  }
};

/**
 * Check if user is verified (email verified)
 */
const requireVerified = async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address to access this resource.'
      }
    });
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  verifyRefreshToken,
  requireVerified
};






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