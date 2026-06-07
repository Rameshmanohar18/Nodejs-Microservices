const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/v1/analytics.controller');

/**
 * @route   GET /api/v1/analytics/user/activity
 * @desc    Get user activity analytics
 * @access  Private
 */
router.get('/user/activity', analyticsController.getUserActivity);

/**
 * @route   GET /api/v1/analytics/orders/overview
 * @desc    Order analytics overview
 * @access  Private
 */
router.get('/orders/overview', analyticsController.getOrderAnalytics);

/**
 * @route   GET /api/v1/analytics/products/top
 * @desc    Top selling products
 * @access  Private
 */
router.get('/products/top', analyticsController.getTopProducts);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Revenue analytics
 * @access  Private
 */
router.get('/revenue', analyticsController.getRevenueAnalytics);

module.exports = router;