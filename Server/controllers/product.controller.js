const productService = require('../../services/product/product.service');

class ProductController {
  // Use Case: Get all products with filtering
  async getAllProducts(req, res) {
    try {
      const { category, minPrice, maxPrice, sort } = req.query;
      
      // Call service to handle business logic
      const products = await productService.findProducts({
        category,
        minPrice,
        maxPrice,
        sort
      });
      
      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Use Case: Create new product
  async createProduct(req, res) {
    // Validate user has permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const product = await productService.create(req.body);
    res.status(201).json({ success: true, data: product });
  }
}
// When to use Controllers:

// Handling API endpoints ✅

// Processing form submissions ✅

// Managing file uploads ✅

// Authentication/authorization checks ✅