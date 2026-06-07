/**
 * RASP (Runtime Application Self-Protection) Middleware
 * Actively blocks attacks in real-time
 */

const logger = require('../../config/logger/winston.config');
const redisClient = require('../../config/database/redis.config');

// Attack patterns for detection
const ATTACK_PATTERNS = {
  // SQL/NoSQL Injection
  nosqlInjection: [
    /\$where/,
    /\$regex/,
    /\$ne/,
    /\$gt/,
    /\$lt/,
    /\$or/,
    /\$and/,
    /'.*'.*'.*'/,
    /".*".*".*"/
  ],
  
  // XSS (Cross-Site Scripting)
  xss: [
    /<script\b[^>]*>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /eval\s*\(/i,
    /alert\s*\(/i,
    /document\.cookie/i
  ],
  
  // Path Traversal
  pathTraversal: [
    /\.\.\//,
    /\.\.\\/,
    /\/etc\/passwd/,
    /\/var\/www/
  ],
  
  // Command Injection
  commandInjection: [
    /\|\|/,
    /&&/,
    /;/,
    /`/,
    /\$\(/,
    /\$\{/,
    /rm\s+-rf/,
    /wget\s+/,
    /curl\s+/
  ],
  
  // SSRF (Server-Side Request Forgery)
  ssrf: [
    /^https?:\/\/169.254.169.254/,
    /^https?:\/\/metadata.google.internal/,
    /^https?:\/\/127\.0\.0\.1/,
    /^https?:\/\/localhost/
  ],
  
  // XXE (XML External Entity)
  xxe: [
    /<!ENTITY/,
    /SYSTEM/,
    /<?xml.*?>/
  ]
};

// IP reputation tracking
class RASPManager {
  constructor() {
    this.blockedIPs = new Set();
    this.suspiciousIPs = new Map();
    this.requestCounts = new Map();
  }

  /**
   * Analyze request for attacks
   */
  analyzeRequest(req) {
    const threats = [];
    const requestData = {
      body: JSON.stringify(req.body || {}),
      query: JSON.stringify(req.query || {}),
      params: JSON.stringify(req.params || {}),
      headers: JSON.stringify(req.headers || {}),
      ip: req.ip,
      path: req.path,
      method: req.method
    };

    // Check each source for attack patterns
    for (const [source, data] of Object.entries(requestData)) {
      if (source === 'ip' || source === 'path' || source === 'method') continue;
      
      for (const [attackType, patterns] of Object.entries(ATTACK_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(data)) {
            threats.push({
              type: attackType,
              source: source,
              payload: this.extractPayload(data, pattern),
              timestamp: new Date(),
              ip: req.ip,
              path: req.path,
              method: req.method
            });
          }
        }
      }
    }

    return threats;
  }

  /**
   * Extract malicious payload
   */
  extractPayload(data, pattern) {
    const match = data.match(pattern);
    return match ? match[0] : 'Unknown';
  }

  /**
   * Check for DoS/DDoS attempts
   */
  checkForDoS(req) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    
    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, []);
    }
    
    const requests = this.requestCounts.get(ip);
    requests.push(now);
    
    // Clean old requests
    const validRequests = requests.filter(time => now - time < windowMs);
    this.requestCounts.set(ip, validRequests);
    
    if (validRequests.length > 100) {
      this.blockIP(ip, 'DoS Attack Detected');
      return {
        type: 'DoS',
        severity: 'HIGH',
        message: `IP ${ip} blocked for DoS attack`,
        requestCount: validRequests.length
      };
    }
    
    return null;
  }

  /**
   * Block malicious IP
   */
  async blockIP(ip, reason) {
    this.blockedIPs.add(ip);
    
    // Store in Redis with expiry
    await redisClient.sadd('blocked_ips', ip);
    await redisClient.expire('blocked_ips', 3600); // Block for 1 hour
    
    // Log to audit
    logger.warn(`IP blocked: ${ip} - Reason: ${reason}`);
  }

  /**
   * Take automated action based on threat
   */
  takeAction(threat, threatCount) {
    const actionMap = {
      nosqlInjection: { action: 'BLOCK', statusCode: 403, message: 'Potential NoSQL injection detected' },
      xss: { action: 'SANITIZE', statusCode: 200, message: 'Request sanitized' },
      pathTraversal: { action: 'BLOCK', statusCode: 403, message: 'Path traversal attempt blocked' },
      commandInjection: { action: 'BLOCK', statusCode: 403, message: 'Command injection attempt blocked' },
      ssrf: { action: 'BLOCK', statusCode: 403, message: 'SSRF attempt blocked' },
      xxe: { action: 'BLOCK', statusCode: 403, message: 'XXE attempt blocked' },
      DoS: { action: 'BLOCK', statusCode: 429, message: 'Rate limit exceeded' }
    };

    const defaultAction = { action: 'LOG_ONLY', statusCode: 200 };
    const action = actionMap[threat.type] || defaultAction;

    // If multiple threats from same IP, escalate action
    if (threatCount >= 3) {
      action.action = 'BLOCK';
      action.message = 'Multiple threats detected - IP blocked';
    }

    return action;
  }

  /**
   * Sanitize malicious input
   */
  sanitizeInput(obj) {
    if (typeof obj === 'string') {
      // Remove script tags
      let sanitized = obj.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      // Remove javascript: protocol
      sanitized = sanitized.replace(/javascript:/gi, '');
      // Remove event handlers
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
      // Remove HTML tags (optional)
      // sanitized = sanitized.replace(/<[^>]*>/g, '');
      return sanitized;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj[key] = this.sanitizeInput(obj[key]);
        }
      }
    }
    
    return obj;
  }
}

// Singleton instance
const rasp = new RASPManager();

// Main RASP middleware
const raspMiddleware = async (req, res, next) => {
  // Skip for health checks and metrics
  if (req.path === '/health' || req.path === '/metrics') {
    return next();
  }

  // Check if IP is blocked
  const isBlocked = await redisClient.sismember('blocked_ips', req.ip);
  if (isBlocked) {
    logger.warn(`Blocked request from ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: {
        code: 'IP_BLOCKED',
        message: 'Your IP has been blocked due to suspicious activity'
      }
    });
  }

  // Analyze request for threats
  const threats = rasp.analyzeRequest(req);
  const dosThreat = rasp.checkForDoS(req);
  
  if (dosThreat) {
    threats.push(dosThreat);
  }

  if (threats.length > 0) {
    // Count threats from this IP
    const threatCount = await redisClient.incr(`threats:${req.ip}`);
    await redisClient.expire(`threats:${req.ip}`, 3600);

    // Log threat
    logger.error('RASP Threat Detected:', {
      ip: req.ip,
      threats: threats,
      userAgent: req.headers['user-agent'],
      path: req.path
    });

    // Take action for the most severe threat
    const mostSevere = threats[0];
    const action = rasp.takeAction(mostSevere, threatCount);

    if (action.action === 'BLOCK') {
      await rasp.blockIP(req.ip, mostSevere.type);
      return res.status(action.statusCode).json({
        success: false,
        error: {
          code: 'SECURITY_BLOCK',
          message: action.message,
          reference: 'RASP-001'
        }
      });
    }

    if (action.action === 'SANITIZE') {
      // Sanitize request data
      if (req.body) req.body = rasp.sanitizeInput(req.body);
      if (req.query) req.query = rasp.sanitizeInput(req.query);
      if (req.params) req.params = rasp.sanitizeInput(req.params);
      
      // Add header indicating sanitization
      res.setHeader('X-Content-Sanitized', 'true');
    }
  }

  next();
};

module.exports = raspMiddleware;