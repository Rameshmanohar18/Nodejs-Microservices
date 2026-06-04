const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/ai.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');
const { validateAIRequest } = require('../../validations/ai.validation');
const { aiRateLimiter } = require('../../middleware/aiRateLimit.middleware');

// Public routes (rate limited)
router.post('/chat', aiRateLimiter, validateAIRequest, aiController.generalChat);
router.post('/search-refine', aiRateLimiter, aiController.refineSearch);

// Protected routes (require authentication)
router.post('/recommendations', authMiddleware, aiRateLimiter, aiController.getRecommendations);
router.post('/enhance-description', authMiddleware, aiRateLimiter, aiController.enhanceDescription);
router.post('/support', authMiddleware, aiRateLimiter, aiController.getSupport);

module.exports = router;