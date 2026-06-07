/**
 * Middleware Index
 * Central export of all middleware
 */

// Auth middleware
const { authenticate, optionalAuth, verifyRefreshToken, requireVerified } = require('./auth/auth.middleware');
const { authorize, hasPermission, isResourceOwner, restrictToOwnOrAdmin } = require('./auth/role.middleware');

// Security middleware
const raspMiddleware = require('./security/rasp.middleware');
const { iastAgent, iastMiddleware } = require('./security/iast.agent');
const wafMiddleware = require('./security/waf.middleware');
const { auditLogger, auditMiddleware, AUDIT_EVENTS } = require('./security/audit.middleware');

// Validation middleware
const { validate, schemas, validateAsync } = require('./validation.middleware');

// Error middleware
const { errorHandler, notFoundHandler, catchAsync, AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } = require('./error.middleware');

// Rate limiting
const { generalLimiter, authLimiter, apiLimiter, adminLimiter, orderLimiter, searchLimiter } = require('./rateLimit.middleware');

// Cache middleware
const { cache, clearCache, staleWhileRevalidate } = require('./cache.middleware');

// Other middleware
const compressionMiddleware = require('./compression.middleware');
const loggingMiddleware = require('./logging.middleware');
const { requestIdMiddleware, getRequestId } = require('./requestId.middleware');
const sanitizeMiddleware = require('./sanitize.middleware');
const { uploadProductImage, uploadProductImages, uploadAvatar, handleUploadError } = require('./fileUpload.middleware');

module.exports = {
  // Auth
  authenticate,
  optionalAuth,
  verifyRefreshToken,
  requireVerified,
  authorize,
  hasPermission,
  isResourceOwner,
  restrictToOwnOrAdmin,
  
  // Security
  raspMiddleware,
  iastAgent,
  iastMiddleware,
  wafMiddleware,
  auditLogger,
  auditMiddleware,
  AUDIT_EVENTS,
  
  // Validation
  validate,
  schemas,
  validateAsync,
  
  // Error handling
  errorHandler,
  notFoundHandler,
  catchAsync,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  
  // Rate limiting
  generalLimiter,
  authLimiter,
  apiLimiter,
  adminLimiter,
  orderLimiter,
  searchLimiter,
  
  // Cache
  cache,
  clearCache,
  staleWhileRevalidate,
  
  // Other
  compressionMiddleware,
  loggingMiddleware,
  requestIdMiddleware,
  getRequestId,
  sanitizeMiddleware,
  uploadProductImage,
  uploadProductImages,
  uploadAvatar,
  handleUploadError
};