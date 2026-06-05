import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { catchAsync } from '../../utils/helpers/catchAsync.js';
import { ApiError } from '../../utils/helpers/apiError.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  
  if (!token) {
    throw new ApiError(401, 'You are not logged in. Please log in to access this resource');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new ApiError(401, 'The user belonging to this token no longer exists');
    }
    
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new ApiError(401, 'User recently changed password. Please log in again');
    }
    
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid token. Please log in again');
  }
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
};

export const verifyOwnership = (model) => {
  return catchAsync(async (req, res, next) => {
    const resource = await model.findById(req.params.id);
    
    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }
    
    if (resource.user && resource.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'You do not have permission to access this resource');
    }
    
    req.resource = resource;
    next();
  });
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