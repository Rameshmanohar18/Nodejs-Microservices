const aiService = require('../services/ai.service');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/ai/recommendations
 * Get AI product recommendations based on user query
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const { query, limit = 5 } = req.body;
  
  if (!query) {
    return res.status(400).json(new ApiResponse(400, null, 'Query is required'));
  }
  
  // Fetch relevant products from DB
  const products = await Product.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  }).limit(limit);
  
  if (products.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, 'No products found'));
  }
  
  const aiResponse = await aiService.getProductRecommendations(query, products);
  
  res.status(200).json(new ApiResponse(200, {
    query,
    aiRecommendation: aiResponse.message,
    products: products,
    tokensUsed: aiResponse.tokensUsed
  }, 'Recommendations generated'));
});

/**
 * POST /api/v1/ai/enhance-description
 * Enhance product description using AI
 */
const enhanceDescription = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  if (!name || !description) {
    return res.status(400).json(new ApiResponse(400, null, 'Name and description required'));
  }
  
  const enhanced = await aiService.enhanceProductDescription(name, description);
  
  res.status(200).json(new ApiResponse(200, {
    original: description,
    enhanced: enhanced.message,
    tokensUsed: enhanced.tokensUsed
  }, 'Description enhanced'));
});

/**
 * POST /api/v1/ai/support
 * AI-powered customer support
 */
const getSupport = asyncHandler(async (req, res) => {
  const { message, orderId } = req.body;
  const userId = req.user.id;
  
  if (!message) {
    return res.status(400).json(new ApiResponse(400, null, 'Message is required'));
  }
  
  let orderContext = null;
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    orderContext = order ? `Order #${order.orderId} - Status: ${order.status}` : null;
  }
  
  const aiResponse = await aiService.getSupportResponse(message, orderContext);
  
  res.status(200).json(new ApiResponse(200, {
    userMessage: message,
    aiResponse: aiResponse.message,
    tokensUsed: aiResponse.tokensUsed
  }, 'Support response generated'));
});

/**
 * POST /api/v1/ai/chat
 * General purpose AI chat (with context memory)
 */
let chatHistories = new Map(); // Simple in-memory store (use Redis in production)

const generalChat = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json(new ApiResponse(400, null, 'Message is required'));
  }
  
  const chatId = sessionId || req.user?.id || 'anonymous';
  
  // Get or create chat history for this session
  let history = chatHistories.get(chatId) || [];
  
  // Add user message to history
  history.push({ role: 'user', content: message });
  
  // Keep only last 10 messages for context window management
  if (history.length > 10) {
    history = history.slice(-10);
  }
  
  const systemPrompt = {
    role: 'system',
    content: `You are Flipkart AI Assistant. Help users with:
- Product recommendations
- Order tracking
- Return/refund policies
- General shopping questions
Be concise, helpful, and friendly. Current date: ${new Date().toLocaleDateString()}`
  };
  
  const messages = [systemPrompt, ...history];
  
  const aiResponse = await aiService.getChatCompletion(messages);
  
  if (aiResponse.success) {
    // Save assistant response to history
    history.push({ role: 'assistant', content: aiResponse.message });
    chatHistories.set(chatId, history);
  }
  
  res.status(200).json(new ApiResponse(200, {
    message: aiResponse.message,
    sessionId: chatId,
    tokensUsed: aiResponse.tokensUsed
  }, 'Chat response generated'));
});

/**
 * POST /api/v1/ai/search-refine
 * Smart search refinement using AI
 */
const refineSearch = asyncHandler(async (req, res) => {
  const { query, searchResults } = req.body;
  
  if (!query) {
    return res.status(400).json(new ApiResponse(400, null, 'Search query is required'));
  }
  
  const aiResponse = await aiService.refineSearchQuery(query, searchResults || []);
  
  res.status(200).json(new ApiResponse(200, {
    originalQuery: query,
    refinedTerms: aiResponse.refined || null,
    suggestions: aiResponse.message
  }, 'Search refinement complete'));
});

module.exports = {
  getRecommendations,
  enhanceDescription,
  getSupport,
  generalChat,
  refineSearch,
};