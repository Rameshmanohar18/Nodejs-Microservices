/**
 * WAF (Web Application Firewall) Middleware
 * Filters and monitors HTTP requests for malicious patterns
 */

const logger = require('../../config/logger/winston.config');
const redisClient = require('../../config/database/redis.config');

// WAF Rules Configuration
const WAF_RULES = {
  // Blocked IP ranges (CIDR)
  blockedIPRanges: [
    '10.0.0.0/8',      // Private networks (internal only)
    '172.16.0.0/12',
    '192.168.0.0/16'
  ],
  
  // Allowed HTTP methods
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  
  // Blocked user agents (bots, scrapers)
  blockedUserAgents: [
    /^$/i,                           // Empty user agent
    /curl/i,                         // Curl
    /wget/i,                         // Wget
    /python-requests/i,              // Python requests
    /scrapy/i,                       // Scrapy
    /go-http-client/i,               // Go client
    /Apache-HttpClient/i,            // Apache HttpClient
    /Java/i,                         // Java clients
    /perl/i,                         // Perl
    /ruby/i                          // Ruby
  ],
  
  // Allowed content types
  allowedContentTypes: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ],
  
  // Maximum request size (in bytes)
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  
  // Maximum URL length
  maxUrlLength: 2048,
  
  // SQL Injection patterns
  sqlInjection: [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /(\%22)|(\")/i,
    /union\s+select/i,
    /select.*from/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /drop\s+table/i,
    /update.*set/i,
    /exec(\s|\+)+(s|x)p/i,
    /execute(\s|\+)+/i
  ],
  
  // XSS patterns
  xss: [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i
  ],
  
  // Path traversal patterns
  pathTraversal: [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e\\/i,
    /\.\.%5c/i,
    /%252e%252e%252f/i
  ],
  
  // Server-side request forgery patterns
  ssrf: [
    /^https?:\/\/169.254.169.254/,
    /^https?:\/\/metadata\.google\.internal/,
    /^https?:\/\/127\.0\.0\.1/,
    /^https?:\/\/localhost/,
    /^https?:\/\/0.0.0.0/,
    /^https?:\/\/\[::1\]/
  ],
  
  // HTTP header injection
  headerInjection: [
    /\r\n/i,
    /\n/i,
    /%0d%0a/i,
    /%0a/i
  ]
};

class WAFManager {
  constructor() {
    this.blockedIPs = new Set();
    this.requestHistory = new Map();
  }

  /**
   * Validate HTTP method
   */
  validateMethod(method) {
    if (!WAF_RULES.allowedMethods.includes(method)) {
      return {
        valid: false,
        reason: `HTTP method ${method} is not allowed`
      };
    }
    return { valid: true };
  }

  /**
   * Validate content type
   */
  validateContentType(contentType) {
    if (!contentType) return { valid: true };
    
    const baseType = contentType.split(';')[0].trim();
    if (!WAF_RULES.allowedContentTypes.includes(baseType)) {
      return {
        valid: false,
        reason: `Content-Type ${baseType} is not allowed`
      };
    }
    return { valid: true };
  }

  /**
   * Validate request size
   */
  validateRequestSize(req) {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > WAF_RULES.maxRequestSize) {
      return {
        valid: false,
        reason: `Request size ${contentLength} exceeds maximum ${WAF_RULES.maxRequestSize}`
      };
    }
    return { valid: true };
  }

  /**
   * Validate URL
   */
  validateUrl(url) {
    if (url.length > WAF_RULES.maxUrlLength) {
      return {
        valid: false,
        reason: `URL length ${url.length} exceeds maximum ${WAF_RULES.maxUrlLength}`
      };
    }
    return { valid: true };
  }

  /**
   * Validate user agent
   */
  validateUserAgent(userAgent) {
    for (const pattern of WAF_RULES.blockedUserAgents) {
      if (pattern.test(userAgent)) {
        return {
          valid: false,
          reason: `User agent ${userAgent} is blocked`
        };
      }
    }
    return { valid: true };
  }

  /**
   * Check for injection attacks
   */
  checkForInjections(data, source) {
    const injections = [];
    
    if (typeof data === 'string') {
      // Check SQL injection
      for (const pattern of WAF_RULES.sqlInjection) {
        if (pattern.test(data)) {
          injections.push({
            type: 'SQL Injection',
            source: source,
            pattern: pattern.toString()
          });
        }
      }
      
      // Check XSS
      for (const pattern of WAF_RULES.xss) {
        if (pattern.test(data)) {
          injections.push({
            type: 'XSS',
            source: source,
            pattern: pattern.toString()
          });
        }
      }
      
      // Check path traversal
      for (const pattern of WAF_RULES.pathTraversal) {
        if (pattern.test(data)) {
          injections.push({
            type: 'Path Traversal',
            source: source,
            pattern: pattern.toString()
          });
        }
      }
      
      // Check SSRF
      for (const pattern of WAF_RULES.ssrf) {
        if (pattern.test(data)) {
          injections.push({
            type: 'SSRF',
            source: source,
            pattern: pattern.toString()
          });
        }
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        injections.push(...this.checkForInjections(value, `${source}.${key}`));
      }
    }
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        injections.push(...this.checkForInjections(item, `${source}[${index}]`));
      });
    }
    
    return injections;
  }

  /**
   * Check IP against blocked ranges
   */
  isIPBlocked(ip) {
    // Check against blocked list
    if (this.blockedIPs.has(ip)) {
      return true;
    }
    
    // Check against blocked ranges (simplified)
    const ipNum = this.ipToNumber(ip);
    for (const range of WAF_RULES.blockedIPRanges) {
      if (this.isIPInRange(ipNum, range)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Convert IP to number
   */
  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Check if IP is in CIDR range
   */
  isIPInRange(ipNum, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1) >>> 0;
    const rangeNum = this.ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  /**
   * Block IP address
   */
  async blockIP(ip, reason, duration = 3600) {
    this.blockedIPs.add(ip);
    await redisClient.sadd('waf_blocked_ips', ip);
    await redisClient.expire('waf_blocked_ips', duration);
    
    logger.warn(`WAF: IP ${ip} blocked - Reason: ${reason}`);
  }
}

// Singleton instance
const waf = new WAFManager();

// Main WAF middleware
const wafMiddleware = async (req, res, next) => {
  // Skip WAF for health checks and metrics
  const skipPaths = ['/health', '/metrics', '/ready', '/favicon.ico'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  // 1. Check if IP is blocked
  const isBlocked = await redisClient.sismember('waf_blocked_ips', req.ip);
  if (isBlocked || waf.isIPBlocked(req.ip)) {
    logger.warn(`WAF: Blocked request from ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: {
        code: 'IP_BLOCKED',
        message: 'Your IP has been blocked by WAF'
      }
    });
  }
  
  // 2. Validate HTTP method
  const methodCheck = waf.validateMethod(req.method);
  if (!methodCheck.valid) {
    logger.warn(`WAF: Invalid method from ${req.ip}: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: methodCheck.reason
      }
    });
  }
  
  // 3. Validate content type
  const contentTypeCheck = waf.validateContentType(req.headers['content-type']);
  if (!contentTypeCheck.valid) {
    logger.warn(`WAF: Invalid content type from ${req.ip}: ${req.headers['content-type']}`);
    return res.status(415).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: contentTypeCheck.reason
      }
    });
  }
  
  // 4. Validate request size
  const sizeCheck = waf.validateRequestSize(req);
  if (!sizeCheck.valid) {
    logger.warn(`WAF: Request size exceeded from ${req.ip}`);
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: sizeCheck.reason
      }
    });
  }
  
  // 5. Validate URL
  const urlCheck = waf.validateUrl(req.originalUrl);
  if (!urlCheck.valid) {
    logger.warn(`WAF: Invalid URL from ${req.ip}: ${req.originalUrl}`);
    return res.status(414).json({
      success: false,
      error: {
        code: 'URI_TOO_LONG',
        message: urlCheck.reason
      }
    });
  }
  
  // 6. Validate user agent
  const userAgentCheck = waf.validateUserAgent(req.headers['user-agent']);
  if (!userAgentCheck.valid) {
    logger.warn(`WAF: Blocked user agent from ${req.ip}: ${req.headers['user-agent']}`);
    await waf.blockIP(req.ip, 'Blocked user agent', 3600);
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Access denied'
      }
    });
  }
  
  // 7. Check for injection attacks
  const allData = {
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  };
  
  let allInjections = [];
  for (const [source, data] of Object.entries(allData)) {
    if (data) {
      const injections = waf.checkForInjections(data, source);
      allInjections.push(...injections);
    }
  }
  
  if (allInjections.length > 0) {
    logger.error(`WAF: Injection attempts detected from ${req.ip}`, {
      injections: allInjections,
      path: req.path
    });
    
    await waf.blockIP(req.ip, `Injection attempts: ${allInjections.map(i => i.type).join(', ')}`, 7200);
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'WAF_BLOCKED',
        message: 'Request blocked by Web Application Firewall',
        reference: 'WAF-001'
      }
    });
  }
  
  // Add WAF headers
  res.setHeader('X-WAF-Protected', 'true');
  res.setHeader('X-WAF-Version', '1.0.0');
  
  next();
};

module.exports = wafMiddleware;