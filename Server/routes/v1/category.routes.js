const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/v1/category.controller');
const { authenticate } = require('../../middleware/auth/auth.middleware');
const { authorize } = require('../../middleware/auth/role.middleware');

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   GET /api/v1/categories/:slug/products
 * @desc    Get products by category slug
 * @access  Public
 */
router.get('/:slug/products', categoryController.getProductsByCategory);

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category (Admin only)
 * @access  Private/Admin
 */
router.post('/', authenticate, authorize('admin'), categoryController.createCategory);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', authenticate, authorize('admin'), categoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, authorize('admin'), categoryController.deleteCategory);

module.exports = router;