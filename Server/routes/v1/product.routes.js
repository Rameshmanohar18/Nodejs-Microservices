import express from 'express';
import * as productController from '../../controllers/v1/product.controller.js';
import { protect, restrictTo } from '../../middleware/auth/auth.middleware.js';
import { upload } from '../../middleware/file/upload.middleware.js';

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:slug', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

router.use(protect);

router.post('/', restrictTo('seller', 'admin'), upload.array('images', 5), productController.createProduct);
router.put('/:id', restrictTo('seller', 'admin'), productController.updateProduct);
router.delete('/:id', restrictTo('seller', 'admin'), productController.deleteProduct);
router.post('/:id/review', productController.addReview);
router.get('/:id/reviews', productController.getProductReviews);

export default router;