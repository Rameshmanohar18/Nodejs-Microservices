const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/v1/admin.controller');
const { authorize } = require('../../middleware/auth/role.middleware');
const { rateLimiter } = require('../../middleware/rateLimit.middleware');

// All admin routes require admin role and stricter rate limiting
router.use(authorize('admin'));
router.use(rateLimiter);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Admin dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Private/Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   PUT /api/v1/admin/users/:id/block
 * @desc    Block/unblock user
 * @access  Private/Admin
 */
router.put('/users/:id/block', adminController.toggleUserBlock);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user (permanent)
 * @access  Private/Admin
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Get all orders with filters
 * @access  Private/Admin
 */
router.get('/orders', adminController.getAllOrders);

/**
 * @route   PUT /api/v1/admin/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
router.put('/orders/:id/status', adminController.updateOrderStatus);

/**
 * @route   GET /api/v1/admin/sales
 * @desc    Sales reports and analytics
 * @access  Private/Admin
 */
router.get('/sales', adminController.getSalesReport);

/**
 * @route   GET /api/v1/admin/inventory/alerts
 * @desc    Low stock alerts
 * @access  Private/Admin
 */
router.get('/inventory/alerts', adminController.getLowStockAlerts);

/**
 * @route   POST /api/v1/admin/inventory/restock
 * @desc    Bulk inventory update
 * @access  Private/Admin
 */
router.post('/inventory/restock', adminController.restockInventory);

module.exports = router;