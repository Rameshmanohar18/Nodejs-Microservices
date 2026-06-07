const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/v1/review.controller');
const { authenticate } = require('../../middleware/auth/auth.middleware');

/**
 * @route   GET /api/v1/reviews/product/:productId
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get('/product/:productId', reviewController.getProductReviews);

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update review
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, reviewController.updateReview);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete review
 * @access  Private (owner or admin)
 */
router.delete('/:id', authenticate, reviewController.deleteReview);

/**
 * @route   POST /api/v1/reviews/:id/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
router.post('/:id/helpful', authenticate, reviewController.markHelpful);

module.exports = router;