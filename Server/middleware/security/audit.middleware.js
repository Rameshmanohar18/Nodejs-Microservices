/**
 * Audit Logging Middleware
 * Logs all security-relevant events for compliance and forensics
 */

const logger = require('../../config/logger/winston.config');

// Audit event types
const AUDIT_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'authentication.login.success',
  LOGIN_FAILURE: 'authentication.login.failure',
  LOGOUT: 'authentication.logout',
  PASSWORD_CHANGE: 'authentication.password.change',
  PASSWORD_RESET: 'authentication.password.reset',
  MFA_ENABLED: 'authentication.mfa.enabled',
  MFA_DISABLED: 'authentication.mfa.disabled',
  
  // Authorization events
  ACCESS_GRANTED: 'authorization.access.granted',
  ACCESS_DENIED: 'authorization.access.denied',
  ROLE_CHANGED: 'authorization.role.changed',
  
  // User management events
  USER_CREATED: 'user.management.created',
  USER_UPDATED: 'user.management.updated',
  USER_DELETED: 'user.management.deleted',
  USER_BLOCKED: 'user.management.blocked',
  USER_UNBLOCKED: 'user.management.unblocked',
  
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded',
  
  // Payment events
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  
  // Security events
  SECURITY_ALERT: 'security.alert',
  WAF_BLOCK: 'security.waf.block',
  RASP_BLOCK: 'security.rasp.block',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',
  
  // Admin events
  ADMIN_ACTION: 'admin.action',
  CONFIG_CHANGE: 'admin.config.change',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  
  // Data events
  DATA_EXPORT: 'data.export',
  DATA_IMPORT: 'data.import',
  DATA_DELETE: 'data.delete'
};

class AuditLogger {
  /**
   * Log an audit event
   * @param {string} eventType - Type of audit event
   * @param {object} data - Event data
   * @param {object} req - Express request object
   */
  log(eventType, data = {}, req = null) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType: eventType,
      eventId: this.generateEventId(),
      data: data,
      ...this.getRequestContext(req)
    };
    
    // Log with appropriate level based on severity
    const severity = this.getEventSeverity(eventType);
    
    switch (severity) {
      case 'CRITICAL':
        logger.error('AUDIT', auditEntry);
        break;
      case 'HIGH':
        logger.warn('AUDIT', auditEntry);
        break;
      default:
        logger.info('AUDIT', auditEntry);
    }
    
    // Store in separate audit log file
    this.writeToAuditFile(auditEntry);
    
    return auditEntry;
  }
  
  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get request context from Express request
   */
  getRequestContext(req) {
    if (!req) {
      return {
        ip: 'unknown',
        userAgent: 'unknown'
      };
    }
    
    return {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id || req.userId,
      userEmail: req.user?.email,
      sessionId: req.session?.id,
      requestId: req.id,
      method: req.method,
      path: req.path,
      query: req.query,
      referer: req.headers.referer
    };
  }
  
  /**
   * Get event severity
   */
  getEventSeverity(eventType) {
    const severityMap = {
      [AUDIT_EVENTS.LOGIN_SUCCESS]: 'INFO',
      [AUDIT_EVENTS.LOGIN_FAILURE]: 'HIGH',
      [AUDIT_EVENTS.PASSWORD_CHANGE]: 'MEDIUM',
      [AUDIT_EVENTS.SECURITY_ALERT]: 'CRITICAL',
      [AUDIT_EVENTS.WAF_BLOCK]: 'HIGH',
      [AUDIT_EVENTS.RASP_BLOCK]: 'HIGH',
      [AUDIT_EVENTS.ADMIN_ACTION]: 'MEDIUM',
      [AUDIT_EVENTS.CONFIG_CHANGE]: 'HIGH',
      [AUDIT_EVENTS.DATA_DELETE]: 'CRITICAL'
    };
    
    return severityMap[eventType] || 'INFO';
  }
  
  /**
   * Write to audit file
   */
  async writeToAuditFile(entry) {
    // In production, write to file or send to log aggregator
    // This is a simplified version
    if (process.env.NODE_ENV === 'production') {
      // Send to centralized logging service
      // await sendToELK(entry);
    }
  }
  
  // Convenience methods for common events
  
  loginSuccess(user, req) {
    return this.log(AUDIT_EVENTS.LOGIN_SUCCESS, {
      userId: user._id,
      email: user.email
    }, req);
  }
  
  loginFailure(email, reason, req) {
    return this.log(AUDIT_EVENTS.LOGIN_FAILURE, {
      email: email,
      reason: reason,
      attempts: req?.failedAttempts
    }, req);
  }
  
  logout(user, req) {
    return this.log(AUDIT_EVENTS.LOGOUT, {
      userId: user._id,
      email: user.email
    }, req);
  }
  
  accessDenied(user, resource, req) {
    return this.log(AUDIT_EVENTS.ACCESS_DENIED, {
      userId: user?._id,
      email: user?.email,
      resource: resource,
      requiredRole: resource.requiredRole
    }, req);
  }
  
  securityAlert(alert, req) {
    return this.log(AUDIT_EVENTS.SECURITY_ALERT, {
      alertType: alert.type,
      severity: alert.severity,
      details: alert.details,
      source: alert.source
    }, req);
  }
  
  adminAction(admin, action, target, req) {
    return this.log(AUDIT_EVENTS.ADMIN_ACTION, {
      adminId: admin._id,
      adminEmail: admin.email,
      action: action,
      target: target,
      changes: action.changes
    }, req);
  }
  
  orderCreated(order, user, req) {
    return this.log(AUDIT_EVENTS.ORDER_CREATED, {
      orderId: order._id,
      orderNumber: order.orderId,
      userId: user._id,
      amount: order.totalAmount,
      items: order.items.length
    }, req);
  }
  
  paymentProcessed(payment, order, req) {
    return this.log(AUDIT_EVENTS.PAYMENT_PROCESSED, {
      paymentId: payment._id,
      transactionId: payment.transactionId,
      orderId: order._id,
      amount: payment.amount,
      method: payment.paymentMethod
    }, req);
  }
  
  dataExported(user, exportType, recordCount, req) {
    return this.log(AUDIT_EVENTS.DATA_EXPORT, {
      userId: user._id,
      email: user.email,
      exportType: exportType,
      recordCount: recordCount,
      format: 'CSV'
    }, req);
  }
}

// Singleton instance
const auditLogger = new AuditLogger();

// Audit middleware for automatic logging
const auditMiddleware = (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  const startTime = Date.now();
  
  // Override end function to log after response
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log based on status code
    if (res.statusCode >= 400 && res.statusCode < 500) {
      auditLogger.log('http.client_error', {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        responseTime: responseTime,
        requestId: req.id
      }, req);
    } else if (res.statusCode >= 500) {
      auditLogger.log('http.server_error', {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        responseTime: responseTime,
        requestId: req.id
      }, req);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  auditLogger,
  auditMiddleware,
  AUDIT_EVENTS
};