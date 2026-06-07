/**
 * Role-Based Access Control Middleware
 * Handles authorization based on user roles and permissions
 */

const logger = require('../../config/logger/winston.config');

/**
 * Check if user has required role
 * @param  {...string} allowedRoles - List of allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email}. Required roles: ${allowedRoles.join(', ')}, User role: ${req.user.role}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}`
        }
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {string} permission - Required permission
 */
const hasPermission = (permission) => {
  const permissionsMap = {
    // Product permissions
    'create:product': ['admin', 'vendor'],
    'update:product': ['admin', 'vendor'],
    'delete:product': ['admin'],
    
    // Order permissions
    'view:all:orders': ['admin'],
    'update:order:status': ['admin'],
    'cancel:any:order': ['admin'],
    
    // User permissions
    'view:all:users': ['admin'],
    'block:user': ['admin'],
    'delete:user': ['admin'],
    
    // Payment permissions
    'process:refund': ['admin'],
    'view:payment:details': ['admin', 'user'],
    
    // Analytics permissions
    'view:analytics': ['admin']
  };

  const allowedRoles = permissionsMap[permission] || [];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      logger.warn(`Permission denied for user ${req.user.email}. Required permission: ${permission}`);
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Missing required permission: ${permission}` }
      });
    }
  };
};

/**
 * Check if user owns the resource
 * @param {Function} getResourceUserId - Function to extract user ID from resource
 */
const isResourceOwner = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceUserId(req);
      
      if (req.user.role === 'admin' || req.user._id.toString() === resourceOwnerId.toString()) {
        next();
      } else {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own resources'
          }
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Restrict access to own data or admin only
 */
const restrictToOwnOrAdmin = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found' }
        });
      }

      const isOwner = resource.user?.toString() === req.user._id.toString();
      
      if (req.user.role === 'admin' || isOwner) {
        req.resource = resource;
        next();
      } else {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authorize,
  hasPermission,
  isResourceOwner,
  restrictToOwnOrAdmin
};