/**
 * IAST (Interactive Application Security Testing) Agent
 * Instruments running application to detect vulnerabilities in real-time
 */

const logger = require('../../config/logger/winston.config');

class IASTAgent {
  constructor() {
    this.vulnerabilities = [];
    this.dataFlow = [];
    this.isActive = process.env.NODE_ENV !== 'production' || process.env.IAST_ENABLED === 'true';
    this.maxDataFlowSize = 1000;
  }

  /**
   * Track data flow from user input to sensitive functions
   */
  trackDataFlow(input, source, destination, context = {}) {
    if (!this.isActive) return;
    
    const flowEntry = {
      id: Date.now() + Math.random().toString(36),
      timestamp: new Date().toISOString(),
      source: source,
      input: this.sanitizeInput(input),
      destination: destination,
      context: {
        userId: global.currentRequest?.userId,
        sessionId: global.currentRequest?.sessionId,
        ip: global.currentRequest?.ip,
        userAgent: global.currentRequest?.userAgent,
        ...context
      },
      stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
    };
    
    this.dataFlow.push(flowEntry);
    
    // Limit data flow size
    if (this.dataFlow.length > this.maxDataFlowSize) {
      this.dataFlow = this.dataFlow.slice(-this.maxDataFlowSize);
    }
    
    // Analyze for vulnerabilities
    this.analyzeDataFlow(flowEntry);
    
    // Send to dashboard if critical
    if (flowEntry.severity === 'CRITICAL') {
      this.sendToDashboard(flowEntry);
    }
  }

  /**
   * Analyze data flow for vulnerability patterns
   */
  analyzeDataFlow(flowEntry) {
    const vulnerablePatterns = [
      {
        pattern: /req\.(body|query|params).*->.*db\.(find|findOne|update)/,
        vulnerability: 'NoSQL Injection',
        severity: 'CRITICAL',
        remediation: 'Use parameterized queries or schema validation'
      },
      {
        pattern: /req\.(body|query|params).*->.*exec/,
        vulnerability: 'Command Injection',
        severity: 'HIGH',
        remediation: 'Use execFile instead of exec with user input'
      },
      {
        pattern: /req\.(body|query|params).*->.*res\.(send|json)/,
        vulnerability: 'Reflected XSS',
        severity: 'MEDIUM',
        remediation: 'Sanitize output or use content security policy'
      },
      {
        pattern: /password.*->.*logger\.(info|debug)/,
        vulnerability: 'Sensitive Data Exposure',
        severity: 'HIGH',
        remediation: 'Never log passwords or sensitive data'
      },
      {
        pattern: /token.*->.*res\.(send|json)/,
        vulnerability: 'Token Exposure',
        severity: 'HIGH',
        remediation: 'Use HTTP-only cookies for tokens'
      },
      {
        pattern: /eval\s*\(.*req\./,
        vulnerability: 'Code Injection',
        severity: 'CRITICAL',
        remediation: 'Never use eval() with user input'
      }
    ];
    
    const flowString = `${flowEntry.source} -> ${flowEntry.destination}`;
    const inputString = JSON.stringify(flowEntry.input);
    
    for (const pattern of vulnerablePatterns) {
      if (pattern.pattern.test(flowString) || pattern.pattern.test(inputString)) {
        this.reportVulnerability({
          type: pattern.vulnerability,
          severity: pattern.severity,
          evidence: flowEntry,
          remediation: pattern.remediation,
          timestamp: new Date()
        });
        break;
      }
    }
  }

  /**
   * Report vulnerability to central dashboard
   */
  reportVulnerability(vuln) {
    this.vulnerabilities.push(vuln);
    
    // Log based on severity
    const logMethod = vuln.severity === 'CRITICAL' ? 'error' : 
                      vuln.severity === 'HIGH' ? 'warn' : 'info';
    
    logger[logMethod](`IAST Vulnerability: ${vuln.type} (${vuln.severity})`, {
      vulnerability: vuln,
      remediation: vuln.remediation
    });
    
    // Trigger alert for critical vulnerabilities
    if (vuln.severity === 'CRITICAL') {
      this.triggerCriticalAlert(vuln);
    }
  }

  /**
   * Send data to security dashboard
   */
  async sendToDashboard(data) {
    try {
      // In production, send to actual dashboard
      if (process.env.NODE_ENV === 'production') {
        await fetch(process.env.SECURITY_DASHBOARD_URL + '/api/iast/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
    } catch (error) {
      logger.error('Failed to send IAST data:', error);
    }
  }

  /**
   * Trigger critical alert
   */
  triggerCriticalAlert(vuln) {
    // Send to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 CRITICAL IAST ALERT: ${vuln.type}\nSeverity: ${vuln.severity}\nRemediation: ${vuln.remediation}`
        })
      });
    }
  }

  /**
   * Sanitize input for logging
   */
  sanitizeInput(input) {
    if (typeof input === 'string') {
      // Truncate long strings
      if (input.length > 500) {
        return input.substring(0, 500) + '... [TRUNCATED]';
      }
      // Remove sensitive patterns
      const sensitivePatterns = [
        /password["']?\s*:\s*["'][^"']*["']/gi,
        /token["']?\s*:\s*["'][^"']*["']/gi,
        /secret["']?\s*:\s*["'][^"']*["']/gi,
        /api_key["']?\s*:\s*["'][^"']*["']/gi
      ];
      
      let sanitized = input;
      for (const pattern of sensitivePatterns) {
        sanitized = sanitized.replace(pattern, (match) => match.replace(/:[^:]+/, ': "[REDACTED]"'));
      }
      return sanitized;
    }
    
    if (typeof input === 'object' && input !== null) {
      // Clone and redact sensitive fields
      const clone = JSON.parse(JSON.stringify(input));
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
      
      const redactSensitive = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;
        for (const key of Object.keys(obj)) {
          if (sensitiveFields.includes(key.toLowerCase())) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            redactSensitive(obj[key]);
          }
        }
      };
      
      redactSensitive(clone);
      return clone;
    }
    
    return input;
  }

  /**
   * Get IAST report
   */
  getReport() {
    return {
      totalVulnerabilities: this.vulnerabilities.length,
      vulnerabilities: this.vulnerabilities.slice(-50),
      dataFlowCount: this.dataFlow.length,
      isActive: this.isActive,
      criticalCount: this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      topVulnerabilities: this.getTopVulnerabilities()
    };
  }

  /**
   * Get top vulnerabilities by type
   */
  getTopVulnerabilities() {
    const counts = {};
    for (const vuln of this.vulnerabilities) {
      counts[vuln.type] = (counts[vuln.type] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Reset IAST data
   */
  reset() {
    this.vulnerabilities = [];
    this.dataFlow = [];
    logger.info('IAST agent reset');
  }
}

// Singleton instance
const iastAgent = new IASTAgent();

// Instrument Node.js built-in modules
const originalMongooseQuery = require('mongoose').Query.prototype.exec;
require('mongoose').Query.prototype.exec = async function(...args) {
  iastAgent.trackDataFlow(
    this._conditions,
    'mongoose.query.conditions',
    'mongoose.exec'
  );
  return originalMongooseQuery.apply(this, args);
};

// Express response instrumentation
const expressApp = require('express')();
const originalJson = expressApp.response.json;
expressApp.response.json = function(body) {
  iastAgent.trackDataFlow(
    body,
    'response.body',
    'res.json',
    { statusCode: this.statusCode }
  );
  return originalJson.call(this, body);
};

// IAST Middleware
const iastMiddleware = (req, res, next) => {
  // Store request context for IAST
  global.currentRequest = {
    userId: req.user?._id,
    sessionId: req.session?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body
  };
  
  next();
};

module.exports = {
  iastAgent,
  iastMiddleware
};