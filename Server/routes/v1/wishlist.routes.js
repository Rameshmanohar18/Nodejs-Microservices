const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/v1/wishlist.controller');

/**
 * @route   GET /api/v1/wishlist
 * @desc    Get user wishlist
 * @access  Private
 */
router.get('/', wishlistController.getWishlist);

/**
 * @route   POST /api/v1/wishlist/add
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post('/add', wishlistController.addToWishlist);

/**
 * @route   DELETE /api/v1/wishlist/remove/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

/**
 * @route   POST /api/v1/wishlist/move-to-cart/:productId
 * @desc    Move product from wishlist to cart
 * @access  Private
 */
router.post('/move-to-cart/:productId', wishlistController.moveToCart);

/**
 * @route   DELETE /api/v1/wishlist/clear
 * @desc    Clear entire wishlist
 * @access  Private
 */
router.delete('/clear', wishlistController.clearWishlist);

module.exports = router;