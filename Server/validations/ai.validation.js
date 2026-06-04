const Joi = require('joi');

const chatSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  sessionId: Joi.string().optional(),
});

const recommendationSchema = Joi.object({
  query: Joi.string().min(2).max(100).required(),
  limit: Joi.number().min(1).max(20).optional(),
});

const enhanceDescriptionSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
});

const supportSchema = Joi.object({
  message: Joi.string().min(1).max(500).required(),
  orderId: Joi.string().optional(),
});

const refineSearchSchema = Joi.object({
  query: Joi.string().min(1).max(50).required(),
  searchResults: Joi.array().optional(),
});

const validateAIRequest = (req, res, next) => {
  const schema = {
    '/ai/chat': chatSchema,
    '/ai/recommendations': recommendationSchema,
    '/ai/enhance-description': enhanceDescriptionSchema,
    '/ai/support': supportSchema,
    '/ai/search-refine': refineSearchSchema,
  }[req.route?.path] || chatSchema;
  
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateAIRequest,
};