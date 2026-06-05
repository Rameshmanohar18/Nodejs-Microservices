import Product from '../../models/product.model.js';
import Category from '../../models/category.model.js';
import Inventory from '../../models/inventory.model.js';
import { redis } from '../../config/database/index.js';
import logger from '../../config/logger/winston.config.js';

class ProductService {
  async createProduct(productData, sellerId) {
    try {
      const product = await Product.create({
        ...productData,
        seller: sellerId
      });
      
      // Create inventory record
      await Inventory.create({
        product: product._id,
        seller: sellerId,
        quantity: productData.stock
      });
      
      // Clear cache
      await redis.clearPattern('products:*');
      
      return product;
    } catch (error) {
      logger.error('ProductService.createProduct error:', error);
      throw error;
    }
  }
  
  async getProductById(productId) {
    try {
      // Try cache first
      const cached = await redis.get(`product:${productId}`);
      if (cached) return cached;
      
      const product = await Product.findById(productId)
        .populate('category', 'name slug')
        .populate('seller', 'name email');
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Increment views
      product.views += 1;
      await product.save();
      
      // Cache for 1 hour
      await redis.set(`product:${productId}`, product, 3600);
      
      return product;
    } catch (error) {
      logger.error('ProductService.getProductById error:', error);
      throw error;
    }
  }
  
  async getAllProducts(query) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        category,
        minPrice,
        maxPrice,
        rating,
        brand,
        search,
        inStock
      } = query;
      
      const filter = { isActive: true };
      
      if (category) {
        filter.category = category;
      }
      
      if (minPrice || maxPrice) {
        filter.finalPrice = {};
        if (minPrice) filter.finalPrice.$gte = Number(minPrice);
        if (maxPrice) filter.finalPrice.$lte = Number(maxPrice);
      }
      
      if (rating) {
        filter.rating = { $gte: Number(rating) };
      }
      
      if (brand) {
        filter.brand = brand;
      }
      
      if (inStock === 'true') {
        filter.stock = { $gt: 0 };
      }
      
      if (search) {
        filter.$text = { $search: search };
      }
      
      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate('category', 'name')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Product.countDocuments(filter)
      ]);
      
      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('ProductService.getAllProducts error:', error);
      throw error;
    }
  }
  
  async updateProduct(productId, updateData, sellerId) {
    try {
      const product = await Product.findOne({ _id: productId, seller: sellerId });
      
      if (!product) {
        throw new Error('Product not found or unauthorized');
      }
      
      Object.assign(product, updateData);
      await product.save();
      
      // Clear cache
      await redis.del(`product:${productId}`);
      await redis.clearPattern('products:*');
      
      return product;
    } catch (error) {
      logger.error('ProductService.updateProduct error:', error);
      throw error;
    }
  }
  
  async deleteProduct(productId, sellerId) {
    try {
      const product = await Product.findOneAndDelete({ _id: productId, seller: sellerId });
      
      if (!product) {
        throw new Error('Product not found or unauthorized');
      }
      
      // Delete inventory
      await Inventory.findOneAndDelete({ product: productId });
      
      // Clear cache
      await redis.del(`product:${productId}`);
      await redis.clearPattern('products:*');
      
      return { message: 'Product deleted successfully' };
    } catch (error) {
      logger.error('ProductService.deleteProduct error:', error);
      throw error;
    }
  }
  
  async getProductsByCategory(categorySlug) {
    try {
      const category = await Category.findOne({ slug: categorySlug });
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      const products = await Product.find({ category: category._id, isActive: true })
        .limit(50)
        .sort('-createdAt');
      
      return products;
    } catch (error) {
      logger.error('ProductService.getProductsByCategory error:', error);
      throw error;
    }
  }
  
  async getFeaturedProducts() {
    try {
      const cached = await redis.get('featured_products');
      if (cached) return cached;
      
      const products = await Product.find({ isFeatured: true, isActive: true })
        .limit(10)
        .sort('-createdAt');
      
      await redis.set('featured_products', products, 3600);
      
      return products;
    } catch (error) {
      logger.error('ProductService.getFeaturedProducts error:', error);
      throw error;
    }
  }
  
  async updateStock(productId, quantity, operation = 'decrease') {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (operation === 'decrease') {
      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }
      product.stock -= quantity;
      product.soldCount += quantity;
    } else if (operation === 'increase') {
      product.stock += quantity;
    }
    
    await product.save();
    
    // Update inventory
    await Inventory.findOneAndUpdate(
      { product: productId },
      { 
        $inc: { quantity: operation === 'decrease' ? -quantity : quantity },
        lastUpdated: new Date()
      }
    );
    
    // Clear cache
    await redis.del(`product:${productId}`);
    
    return product;
  }
}

export default new ProductService();