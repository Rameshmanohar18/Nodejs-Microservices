
/**
 * Socket.IO Index
 * Central export for socket functionality
 */

const { SocketServer, SOCKET_EVENTS } = require('./socketServer');

let socketInstance = null;

/**
 * Initialize socket server
 * @param {Object} server - HTTP server instance
 * @returns {SocketServer} Socket server instance
 */
const initSocketServer = (server) => {
  if (!socketInstance) {
    socketInstance = new SocketServer(server);
  }
  return socketInstance;
};

/**
 * Get socket server instance
 * @returns {SocketServer} Socket server instance
 */
const getSocketServer = () => {
  if (!socketInstance) {
    throw new Error('Socket server not initialized. Call initSocketServer first.');
  }
  return socketInstance;
};

/**
 * Emit order status update
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @param {string} status - New status
 * @param {Object} trackingData - Additional tracking data
 */
const emitOrderUpdate = (orderId, userId, status, trackingData = {}) => {
  const socketServer = getSocketServer();
  socketServer.emitOrderStatusUpdate(orderId, userId, status, trackingData);
};

/**
 * Emit product update
 * @param {string} productId - Product ID
 * @param {Object} updateData - Update data
 */
const emitProductUpdate = (productId, updateData) => {
  const socketServer = getSocketServer();
  socketServer.emitProductUpdate(productId, updateData);
};

/**
 * Send notification to user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
const sendUserNotification = (userId, notification) => {
  const socketServer = getSocketServer();
  socketServer.sendNotification(userId, notification);
};

/**
 * Broadcast system message to all connected users
 * @param {string} message - Message content
 * @param {string} severity - Severity level (info, warning, error, success)
 */
const broadcastSystemMessage = (message, severity = 'info') => {
  const socketServer = getSocketServer();
  socketServer.broadcastSystemMessage(message, severity);
};

module.exports = {
  initSocketServer,
  getSocketServer,
  emitOrderUpdate,
  emitProductUpdate,
  sendUserNotification,
  broadcastSystemMessage,
  SOCKET_EVENTS
};