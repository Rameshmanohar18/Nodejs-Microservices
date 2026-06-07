/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */

const Joi = require('joi');
const logger = require('../config/logger/winston.config');

/**
 * Validate request against Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property];
    
    if (!dataToValidate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `No ${property} data to validate`
        }
      });
    }
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Validation failed', {
        errors: errors,
        path: req.path,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors
        }
      });
    }
    
    // Replace with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // ID parameter schema
  idParam: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
      .messages({ 'string.pattern.base': 'Invalid ID format' })
  }),
  
  // Date range schema
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
      .messages({ 'date.min': 'End date must be after start date' })
  })
};

/**
 * Async validation wrapper for complex validations
 */
const validateAsync = async (data, schema) => {
  try {
    const value = await schema.validateAsync(data, { abortEarly: false });
    return { error: null, value };
  } catch (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { error: errors, value: null };
  }
};

module.exports = {
  validate,
  schemas,
  validateAsync
};