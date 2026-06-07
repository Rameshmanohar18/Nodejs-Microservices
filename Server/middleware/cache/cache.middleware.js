/**
 * Cache Middleware
 * Implements caching for frequently accessed data
 */

const redisClient = require('../config/database/redis.config');
const logger = require('../config/logger/winston.config');

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds
 * @param {Function} keyGenerator - Optional custom key generator
 */
const cache = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      // Default key: user-specific or generic
      const userPrefix = req.user?.id ? `user:${req.user.id}` : 'public';
      cacheKey = `${userPrefix}:${req.originalUrl}`;
    }
    
    try {
      // Check cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        // Return cached response
        const data = JSON.parse(cachedData);
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(data);
      }
      
      // Store original send function
      const originalSend = res.json;
      
      // Override send function to cache response
      res.json = function(data) {
        // Cache the response
        redisClient.setex(cacheKey, duration, JSON.stringify(data))
          .catch(err => logger.error('Cache storage error:', err));
        
        res.setHeader('X-Cache', 'MISS');
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear cache for specific pattern
 * @param {string} pattern - Redis key pattern to clear
 */
const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
};

/**
 * Cache with stale-while-revalidate pattern
 * @param {number} staleTime - Time before marking as stale (seconds)
 * @param {number} revalidateTime - Time to revalidate (seconds)
 */
const staleWhileRevalidate = (staleTime = 60, revalidateTime = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `swr:${req.originalUrl}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = (Date.now() - timestamp) / 1000;
        
        res.setHeader('X-Cache-Age', Math.floor(age));
        
        if (age < staleTime) {
          // Fresh cache
          res.setHeader('X-Cache-Status', 'FRESH');
          return res.json(data);
        } else if (age < revalidateTime) {
          // Stale but return cached while revalidating in background
          res.setHeader('X-Cache-Status', 'STALE');
          
          // Revalidate in background
          setImmediate(() => {
            const originalSend = res.json;
            res.json = (freshData) => {
              redisClient.setex(cacheKey, revalidateTime, JSON.stringify({
                data: freshData,
                timestamp: Date.now()
              }));
              originalSend.call(res, freshData);
            };
            next();
          });
          
          return res.json(data);
        }
      }
      
      // No cache or expired - store new cache
      const originalSend = res.json;
      res.json = function(data) {
        redisClient.setex(cacheKey, revalidateTime, JSON.stringify({
          data: data,
          timestamp: Date.now()
        }));
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('SWR cache error:', error);
      next();
    }
  };
};

module.exports = {
  cache,
  clearCache,
  staleWhileRevalidate
};