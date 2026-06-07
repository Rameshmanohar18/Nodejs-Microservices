
/**
 * Socket.IO Server Configuration
 * Handles real-time communication for live updates, chat, and notifications
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const logger = require('../config/logger/winston.config');
const redisClient = require('../config/database/redis.config');

// ==================== SOCKET EVENTS ====================

const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',
  
  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_STATUS_CHANGED: 'order:status:changed',
  ORDER_TRACKING: 'order:tracking',
  
  // Product events
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_STOCK_CHANGED: 'product:stock:changed',
  PRODUCT_PRICE_CHANGED: 'product:price:changed',
  
  // Cart events
  CART_UPDATED: 'cart:updated',
  
  // Notification events
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification:read',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  
  // Admin events
  ADMIN_STATS: 'admin:stats',
  ADMIN_ALERT: 'admin:alert',
  
  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline'
};

// ==================== SOCKET.IO CONFIGURATION ====================

class SocketServer {
  constructor(server) {
    this.io = null;
    this.server = server;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.roomUsers = new Map(); // roomId -> Set of userIds
    this.typingUsers = new Map(); // roomId -> Set of typing userIds
    
    this.initialize();
  }

  /**
   * Initialize Socket.IO server
   */
  initialize() {
    this.io = socketIO(this.server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization']
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      maxHttpBufferSize: 1e6 // 1MB
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.user = user;
        socket.userId = user._id.toString();
        
        next();
      } catch (error) {
        logger.error(`Socket authentication error: ${error.message}`);
        next(new Error('Invalid token'));
      }
    });

    this.setupEventHandlers();
    this.setupRedisAdapter();
    
    logger.info('Socket.IO server initialized');
  }

  /**
   * Setup Redis adapter for horizontal scaling
   */
  setupRedisAdapter() {
    const redisAdapter = require('@socket.io/redis-adapter');
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    
    this.io.adapter(redisAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured');
  }

  /**
   * Setup all socket event handlers
   */
  setupEventHandlers() {
    this.io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
      this.handleConnection(socket);
      
      // Authenticate socket
      this.handleAuthenticate(socket);
      
      // Order events
      this.handleOrderEvents(socket);
      
      // Product events
      this.handleProductEvents(socket);
      
      // Chat events
      this.handleChatEvents(socket);
      
      // Notification events
      this.handleNotificationEvents(socket);
      
      // User events
      this.handleUserEvents(socket);
      
      // Admin events
      this.handleAdminEvents(socket);
      
      // Disconnect
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle new connection
   */
  handleConnection(socket) {
    logger.info(`New socket connection: ${socket.id}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle authentication
   */
  handleAuthenticate(socket) {
    socket.on(SOCKET_EVENTS.AUTHENTICATE, async (data) => {
      try {
        // User already authenticated via middleware
        if (socket.user) {
          // Store user connection
          this.connectedUsers.set(socket.userId, socket.id);
          this.userSockets.set(socket.id, socket.userId);
          
          // Join user's personal room
          socket.join(`user:${socket.userId}`);
          
          // Broadcast user online status
          this.broadcastUserStatus(socket.userId, true);
          
          // Send user data
          socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
            user: {
              id: socket.user._id,
              name: socket.user.name,
              email: socket.user.email,
              role: socket.user.role
            },
            timestamp: new Date().toISOString()
          });
          
          // Send pending notifications
          await this.sendPendingNotifications(socket);
          
          // Send online users list
          this.sendOnlineUsers(socket);
        }
      } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication failed' });
      }
    });
  }

  /**
   * Handle order-related events
   */
  handleOrderEvents(socket) {
    // Join order tracking room
    socket.on('order:track:join', async ({ orderId }) => {
      try {
        const order = await Order.findOne({ orderId });
        
        if (!order) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Order not found' });
          return;
        }
        
        // Check authorization (user or admin)
        if (order.user.toString() === socket.userId || socket.user.role === 'admin') {
          socket.join(`order:${orderId}`);
          socket.emit('order:track:joined', { orderId, message: 'Now tracking order updates' });
          
          // Send initial order status
          socket.emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
            orderId,
            status: order.status,
            trackingId: order.trackingId,
            estimatedDelivery: order.estimatedDelivery,
            timeline: order.statusHistory
          });
        } else {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Unauthorized to track this order' });
        }
      } catch (error) {
        logger.error(`Order track join error: ${error.message}`);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join order tracking' });
      }
    });
    
    // Leave order tracking room
    socket.on('order:track:leave', ({ orderId }) => {
      socket.leave(`order:${orderId}`);
      socket.emit('order:track:left', { orderId });
    });
  }

  /**
   * Handle product-related events
   */
  handleProductEvents(socket) {
    // Join product updates room
    socket.on('product:watch', ({ productId }) => {
      socket.join(`product:${productId}`);
      socket.emit('product:watched', { productId });
    });
    
    // Leave product updates room
    socket.on('product:unwatch', ({ productId }) => {
      socket.leave(`product:${productId}`);
      socket.emit('product:unwatched', { productId });
    });
  }

  /**
   * Handle chat events
   */
  handleChatEvents(socket) {
    // Join chat room
    socket.on(SOCKET_EVENTS.CHAT_JOIN, ({ roomId }) => {
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      
      this.roomUsers.get(roomId).add(socket.userId);
      socket.join(`chat:${roomId}`);
      
      // Send room info to user
      socket.emit('chat:joined', {
        roomId,
        users: Array.from(this.roomUsers.get(roomId)),
        onlineCount: this.roomUsers.get(roomId).size
      });
      
      // Broadcast to room that user joined
      socket.to(`chat:${roomId}`).emit('chat:user:joined', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });
    
    // Send message
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async ({ roomId, message, type = 'text' }) => {
      try {
        const messageData = {
          id: generateMessageId(),
          userId: socket.userId,
          userName: socket.user.name,
          userAvatar: socket.user.avatar,
          message: message,
          type: type,
          timestamp: new Date().toISOString(),
          roomId: roomId
        };
        
        // Save to database (async)
        this.saveChatMessage(roomId, messageData);
        
        // Broadcast to room
        this.io.to(`chat:${roomId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, messageData);
        
        // Stop typing indicator
        this.handleStopTyping(socket, roomId);
      } catch (error) {
        logger.error(`Chat message error: ${error.message}`);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
      }
    });
    
    // User typing
    socket.on(SOCKET_EVENTS.CHAT_TYPING, ({ roomId, isTyping }) => {
      if (isTyping) {
        this.handleStartTyping(socket, roomId);
      } else {
        this.handleStopTyping(socket, roomId);
      }
    });
    
    // Leave chat room
    socket.on(SOCKET_EVENTS.CHAT_LEAVE, ({ roomId }) => {
      if (this.roomUsers.has(roomId)) {
        this.roomUsers.get(roomId).delete(socket.userId);
      }
      
      socket.leave(`chat:${roomId}`);
      
      socket.to(`chat:${roomId}`).emit('chat:user:left', {
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle typing indicators
   */
  handleStartTyping(socket, roomId) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    
    this.typingUsers.get(roomId).add(socket.userId);
    
    socket.to(`chat:${roomId}`).emit('chat:typing:start', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle stop typing
   */
  handleStopTyping(socket, roomId) {
    if (this.typingUsers.has(roomId)) {
      this.typingUsers.get(roomId).delete(socket.userId);
      
      socket.to(`chat:${roomId}`).emit('chat:typing:stop', {
        userId: socket.userId,
        userName: socket.user.name
      });
    }
  }

  /**
   * Handle notification events
   */
  handleNotificationEvents(socket) {
    // Mark notification as read
    socket.on(SOCKET_EVENTS.NOTIFICATION_READ, async ({ notificationId }) => {
      try {
        // Update notification read status in database
        await this.markNotificationRead(socket.userId, notificationId);
        
        socket.emit('notification:read:confirmed', { notificationId });
      } catch (error) {
        logger.error(`Mark notification read error: ${error.message}`);
      }
    });
    
    // Mark all notifications as read
    socket.on('notification:read:all', async () => {
      try {
        await this.markAllNotificationsRead(socket.userId);
        socket.emit('notification:read:all:confirmed');
      } catch (error) {
        logger.error(`Mark all notifications read error: ${error.message}`);
      }
    });
  }

  /**
   * Handle user events
   */
  handleUserEvents(socket) {
    // Get online users
    socket.on('users:online:get', () => {
      this.sendOnlineUsers(socket);
    });
  }

  /**
   * Handle admin events
   */
  handleAdminEvents(socket) {
    // Only admin users can access these events
    if (socket.user?.role !== 'admin') return;
    
    // Get real-time stats
    socket.on(SOCKET_EVENTS.ADMIN_STATS, async () => {
      setInterval(async () => {
        const stats = await this.getRealTimeStats();
        socket.emit(SOCKET_EVENTS.ADMIN_STATS, stats);
      }, 5000); // Update every 5 seconds
    });
    
    // Broadcast admin alert
    socket.on(SOCKET_EVENTS.ADMIN_ALERT, ({ message, severity, target }) => {
      const alertData = {
        id: generateAlertId(),
        message,
        severity, // info, warning, error, success
        timestamp: new Date().toISOString(),
        source: socket.user.name
      };
      
      if (target === 'all') {
        this.io.emit(SOCKET_EVENTS.ADMIN_ALERT, alertData);
      } else if (target?.startsWith('user:')) {
        this.io.to(target).emit(SOCKET_EVENTS.ADMIN_ALERT, alertData);
      } else {
        socket.emit(SOCKET_EVENTS.ADMIN_ALERT, alertData);
      }
    });
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      const userId = this.userSockets.get(socket.id);
      
      if (userId) {
        this.connectedUsers.delete(userId);
        this.userSockets.delete(socket.id);
        
        // Broadcast user offline
        this.broadcastUserStatus(userId, false);
        
        // Remove from chat rooms
        for (const [roomId, users] of this.roomUsers.entries()) {
          if (users.has(userId)) {
            users.delete(userId);
            socket.to(`chat:${roomId}`).emit('chat:user:left', {
              userId: userId,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Send pending notifications to user
   */
  async sendPendingNotifications(socket) {
    try {
      const notifications = await this.getUserNotifications(socket.userId);
      notifications.forEach(notification => {
        socket.emit(SOCKET_EVENTS.NOTIFICATION, notification);
      });
    } catch (error) {
      logger.error(`Send pending notifications error: ${error.message}`);
    }
  }

  /**
   * Send online users list
   */
  sendOnlineUsers(socket) {
    const onlineUsers = Array.from(this.connectedUsers.keys());
    socket.emit('users:online:list', {
      count: onlineUsers.length,
      users: onlineUsers
    });
  }

  /**
   * Broadcast user online/offline status
   */
  broadcastUserStatus(userId, isOnline) {
    const event = isOnline ? SOCKET_EVENTS.USER_ONLINE : SOCKET_EVENTS.USER_OFFLINE;
    this.io.emit(event, {
      userId,
      timestamp: new Date().toISOString(),
      isOnline
    });
  }

  /**
   * Get real-time statistics for admin
   */
  async getRealTimeStats() {
    return {
      timestamp: new Date().toISOString(),
      connections: {
        total: this.io.engine.clientsCount,
        authenticated: this.connectedUsers.size,
        rooms: this.io.sockets.adapter.rooms.size
      },
      users: {
        online: this.connectedUsers.size,
        guests: this.io.engine.clientsCount - this.connectedUsers.size
      },
      chat: {
        activeRooms: this.roomUsers.size,
        typingUsers: Array.from(this.typingUsers.values()).reduce((sum, set) => sum + set.size, 0)
      }
    };
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Emit order status update to specific user
   */
  emitOrderStatusUpdate(orderId, userId, status, trackingData = {}) {
    this.io.to(`user:${userId}`).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
      orderId,
      status,
      ...trackingData,
      timestamp: new Date().toISOString()
    });
    
    // Also emit to order tracking room
    this.io.to(`order:${orderId}`).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, {
      orderId,
      status,
      ...trackingData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit product update to all watching users
   */
  emitProductUpdate(productId, updateData) {
    this.io.to(`product:${productId}`).emit(SOCKET_EVENTS.PRODUCT_UPDATED, {
      productId,
      ...updateData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit stock change notification
   */
  emitStockChange(productId, oldStock, newStock) {
    this.io.to(`product:${productId}`).emit(SOCKET_EVENTS.PRODUCT_STOCK_CHANGED, {
      productId,
      oldStock,
      newStock,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit notification to user
   */
  sendNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, {
      id: generateNotificationId(),
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit cart update to user
   */
  emitCartUpdate(userId, cartData) {
    this.io.to(`user:${userId}`).emit(SOCKET_EVENTS.CART_UPDATED, {
      ...cartData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast system message to all users
   */
  broadcastSystemMessage(message, severity = 'info') {
    this.io.emit('system:message', {
      message,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get IO instance for external use
   */
  getIO() {
    return this.io;
  }
}

// ==================== HELPER FUNCTIONS ====================

let messageCounter = 0;
let notificationCounter = 0;
let alertCounter = 0;

const generateMessageId = () => {
  return `msg_${Date.now()}_${++messageCounter}`;
};

const generateNotificationId = () => {
  return `notif_${Date.now()}_${++notificationCounter}`;
};

const generateAlertId = () => {
  return `alert_${Date.now()}_${++alertCounter}`;
};

// Mock functions (to be implemented with actual database)
const saveChatMessage = async (roomId, messageData) => {
  // Implementation would save to MongoDB
  logger.debug(`Chat message saved: ${roomId}`, messageData);
};

const getUserNotifications = async (userId) => {
  // Implementation would fetch from database
  return [];
};

const markNotificationRead = async (userId, notificationId) => {
  // Implementation would update database
  logger.debug(`Notification marked read: ${userId} - ${notificationId}`);
};

const markAllNotificationsRead = async (userId) => {
  // Implementation would update database
  logger.debug(`All notifications marked read: ${userId}`);
};

// ==================== EXPORTS ====================

module.exports = {
  SocketServer,
  SOCKET_EVENTS
};