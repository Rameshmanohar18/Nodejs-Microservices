/**
 * FLIPKART CLONE - API ROUTES V1
 * Central route aggregator for all API endpoints
 * Version: 1.0.0
 * Base Path: /api/v1
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const reviewRoutes = require('./review.routes');
const wishlistRoutes = require('./wishlist.routes');
const couponRoutes = require('./coupon.routes');
const searchRoutes = require('./search.routes');
const categoryRoutes = require('./category.routes');
const adminRoutes = require('./admin.routes');
const aiRoutes = require('./ai.routes');
const analyticsRoutes = require('./analytics.routes');

// Import middleware
const { authenticate } = require('../../middleware/auth/auth.middleware');
const { rateLimiter } = require('../../middleware/rateLimit.middleware');
const { auditLog } = require('../../middleware/security/audit.middleware');

// ==================== HEALTH & SYSTEM ROUTES ====================

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

/**
 * @route   GET /api/v1/ready
 * @desc    Readiness probe for Kubernetes
 * @access  Public
 */
router.get('/ready', (req, res) => {
  // Check database connection
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;
  
  // Check Redis connection (if needed)
  // const isRedisConnected = redisClient.isReady;
  
  if (isDbConnected) {
    res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected'
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'not ready',
      database: 'disconnected'
    });
  }
});

/**
 * @route   GET /api/v1/metrics
 * @desc    Prometheus metrics endpoint
 * @access  Internal (optional auth)
 */
router.get('/metrics', async (req, res) => {
  const client = require('prom-client');
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ==================== AUTHENTICATION ROUTES ====================

/**
 * Authentication Routes
 * Base: /api/v1/auth
 */
router.use('/auth', authRoutes);

// ==================== USER ROUTES ====================

/**
 * User Management Routes
 * Base: /api/v1/users
 */
router.use('/users', authenticate, userRoutes);

// ==================== PRODUCT ROUTES ====================

/**
 * Product Catalog Routes
 * Base: /api/v1/products
 */
router.use('/products', productRoutes);

// ==================== CATEGORY ROUTES ====================

/**
 * Category Management Routes
 * Base: /api/v1/categories
 */
router.use('/categories', categoryRoutes);

// ==================== CART ROUTES ====================

/**
 * Shopping Cart Routes
 * Base: /api/v1/cart
 * All routes require authentication
 */
router.use('/cart', authenticate, cartRoutes);

// ==================== ORDER ROUTES ====================

/**
 * Order Management Routes
 * Base: /api/v1/orders
 */
router.use('/orders', authenticate, orderRoutes);

// ==================== PAYMENT ROUTES ====================

/**
 * Payment Processing Routes
 * Base: /api/v1/payments
 */
router.use('/payments', paymentRoutes);

// ==================== REVIEW ROUTES ====================

/**
 * Product Review Routes
 * Base: /api/v1/reviews
 */
router.use('/reviews', reviewRoutes);

// ==================== WISHLIST ROUTES ====================

/**
 * Wishlist Routes
 * Base: /api/v1/wishlist
 */
router.use('/wishlist', authenticate, wishlistRoutes);

// ==================== COUPON ROUTES ====================

/**
 * Coupon/Discount Routes
 * Base: /api/v1/coupons
 */
router.use('/coupons', couponRoutes);

// ==================== SEARCH ROUTES ====================

/**
 * Search & Filter Routes
 * Base: /api/v1/search
 */
router.use('/search', searchRoutes);

// ==================== AI ROUTES ====================

/**
 * Artificial Intelligence Routes
 * Base: /api/v1/ai
 */
router.use('/ai', aiRoutes);

// ==================== ANALYTICS ROUTES ====================

/**
 * Analytics & Reporting Routes
 * Base: /api/v1/analytics
 */
router.use('/analytics', authenticate, analyticsRoutes);

// ==================== ADMIN ROUTES ====================

/**
 * Admin Dashboard Routes
 * Base: /api/v1/admin
 * All routes require admin authentication
 */
router.use('/admin', authenticate, adminRoutes);

// ==================== WEBHOOK ROUTES ====================

/**
 * Webhook Routes (External Services)
 * Base: /api/v1/webhooks
 * No authentication (signature verification)
 */
router.post('/webhooks/razorpay', rateLimiter, async (req, res) => {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  if (signature === expectedSignature) {
    // Process webhook event
    const { event, payload } = req.body;
    
    switch (event) {
      case 'payment.captured':
        // Update payment status
        await require('../../services/payment/payment.service').handlePaymentCapture(payload);
        break;
      case 'payment.failed':
        await require('../../services/payment/payment.service').handlePaymentFailure(payload);
        break;
      case 'refund.created':
        await require('../../services/payment/payment.service').handleRefund(payload);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    res.status(200).json({ received: true });
  } else {
    res.status(401).json({ error: 'Invalid signature' });
  }
});

router.post('/webhooks/sendgrid', rateLimiter, async (req, res) => {
  // SendGrid webhook for email events
  const events = req.body;
  
  for (const event of events) {
    await require('../../services/notification/email.service').handleEmailEvent(event);
  }
  
  res.status(200).json({ received: true });
});

// ==================== UTILITY ROUTES ====================

/**
 * @route   GET /api/v1/version
 * @desc    Get API version info
 * @access  Public
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      apiVersion: 'v1',
      releaseDate: '2024-01-01',
      status: 'stable',
      documentation: '/api-docs',
      supportEmail: 'support@flipkart-clone.com'
    }
  });
});

/**
 * @route   GET /api/v1/status
 * @desc    Get system status
 * @access  Public (rate limited)
 */
router.get('/status', rateLimiter, async (req, res) => {
  const os = require('os');
  const mongoose = require('mongoose');
  
  const systemStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    server: {
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: os.cpus().length,
      loadAverage: os.loadavg()
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    services: {
      redis: await checkRedisConnection(),
      elasticsearch: await checkElasticsearchConnection()
    }
  };
  
  res.status(200).json({
    success: true,
    data: systemStatus
  });
});

// Helper function to check Redis connection
async function checkRedisConnection() {
  try {
    const redisClient = require('../../config/database/redis.config');
    await redisClient.ping();
    return { status: 'connected', latency: '<5ms' };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
}

// Helper function to check Elasticsearch connection
async function checkElasticsearchConnection() {
  try {
    const { Client } = require('@elastic/elasticsearch');
    const client = new Client({ node: process.env.ELASTICSEARCH_URL });
    const health = await client.cluster.health();
    return { status: 'connected', clusterName: health.cluster_name };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
}

// ==================== API DOCUMENTATION ====================

/**
 * @route   GET /api/v1/docs
 * @desc    Redirect to API documentation
 * @access  Public
 */
router.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

/**
 * @route   GET /api/v1/openapi.json
 * @desc    OpenAPI/Swagger specification
 * @access  Public
 */
router.get('/openapi.json', (req, res) => {
  const swaggerDocument = require('../../../swagger.json');
  res.status(200).json(swaggerDocument);
});

// ==================== FALLBACK ROUTE ====================

/**
 * @route   ALL /api/v1/*
 * @desc    Handle 404 for undefined routes
 * @access  Public
 */
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString()
    }
  });
});

// Export the router
module.exports = router;