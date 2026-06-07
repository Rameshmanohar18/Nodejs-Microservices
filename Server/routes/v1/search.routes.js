const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/v1/search.controller');

/**
 * @route   GET /api/v1/search
 * @desc    Global search across products
 * @access  Public
 */
router.get('/', searchController.search);

/**
 * @route   GET /api/v1/search/suggest
 * @desc    Get search suggestions (autocomplete)
 * @access  Public
 */
router.get('/suggest', searchController.getSuggestions);

/**
 * @route   GET /api/v1/search/filters
 * @desc    Get available filters for current search
 * @access  Public
 */
router.get('/filters', searchController.getFilters);

/**
 * @route   POST /api/v1/search/advanced
 * @desc    Advanced search with multiple criteria
 * @access  Public
 */
router.post('/advanced', searchController.advancedSearch);

module.exports = router;