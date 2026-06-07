const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/v1/coupon.controller');
const { authenticate } = require('../../middleware/auth/auth.middleware');
const { authorize } = require('../../middleware/auth/role.middleware');

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate a coupon code
 * @access  Private
 */
router.post('/validate', authenticate, couponController.validateCoupon);

/**
 * @route   GET /api/v1/coupons
 * @desc    Get all coupons (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('admin'), couponController.getAllCoupons);

/**
 * @route   POST /api/v1/coupons
 * @desc    Create coupon (Admin only)
 * @access  Private/Admin
 */
router.post('/', authenticate, authorize('admin'), couponController.createCoupon);

/**
 * @route   PUT /api/v1/coupons/:id
 * @desc    Update coupon (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', authenticate, authorize('admin'), couponController.updateCoupon);

/**
 * @route   DELETE /api/v1/coupons/:id
 * @desc    Delete coupon (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, authorize('admin'), couponController.deleteCoupon);

module.exports = router;