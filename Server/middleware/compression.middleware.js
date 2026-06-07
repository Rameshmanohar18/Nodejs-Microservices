/**
 * Compression Middleware
 * Compresses response bodies for better performance
 */

const compression = require('compression');

/**
 * Compression options
 */
const compressionOptions = {
  // Only compress responses above 1KB
  threshold: 1024,
  
  // Compression level (1-9)
  level: 6,
  
  // Filter function - what to compress
  filter: (req, res) => {
    // Don't compress for IE < 11
    if (req.headers['user-agent'] && /MSIE [1-9]\./.test(req.headers['user-agent'])) {
      return false;
    }
    
    // Don't compress for WebSocket upgrades
    if (req.headers.upgrade === 'websocket') {
      return false;
    }
    
    // Compress everything else
    return compression.filter(req, res);
  },
  
  // Chunk size for streaming
  chunkSize: 16384, // 16KB
  
  // Use brotli if supported (better compression than gzip)
  brotli: {
    enabled: true,
    parameters: {
      [require('zlib').constants.BROTLI_PARAM_QUALITY]: 6
    }
  }
};

/**
 * Compression middleware with content-type optimization
 */
const compressionMiddleware = compression(compressionOptions);

/**
 * Dynamic compression based on content type
 */
const smartCompression = (req, res, next) => {
  // Skip compression for already compressed content
  const skipCompression = [
    'image/',
    'video/',
    'audio/',
    'application/octet-stream'
  ];
  
  const contentType = res.getHeader('content-type');
  if (contentType && skipCompression.some(type => contentType.startsWith(type))) {
    return next();
  }
  
  compressionMiddleware(req, res, next);
};

module.exports = smartCompression;