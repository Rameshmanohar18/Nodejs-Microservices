const User = require('../models/user.model');
const redisClient = require('../config/redis.config');

class UserRepository {
  // Use Case: Find user with caching
  async findById(id) {
    // Check cache first
    const cached = await redisClient.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const user = await User.findById(id);
    
    // Store in cache for 1 hour
    if (user) {
      await redisClient.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);
    }
    
    return user;
  }
  
  // Use Case: Complex search with pagination
  async findUsersWithFilters(filters, page = 1, limit = 10) {
    const query = {};
    
    if (filters.minAge) {
      query.age = { $gte: filters.minAge };
    }
    if (filters.city) {
      query.city = filters.city;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);
    
    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  // Use Case: Bulk update
  async bulkUpdateUserRoles(userIds, newRole) {
    return await User.updateMany(
      { _id: { $in: userIds } },
      { role: newRole }
    );
  }
}



// When to use Repositories:

// Complex database queries ✅

// Implementing caching ✅

// Switching databases later ✅

// Testing (easier to mock) ✅