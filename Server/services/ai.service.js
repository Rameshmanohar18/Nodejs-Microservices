const { openai, aiConfig } = require('../config/openai.config');
const { encoding_for_model } = require('tiktoken');
const logger = require('../config/logger');
const promptTemplates = require('./aiPrompts.service');

/**
 * Generic chat completion with token tracking
 */
const getChatCompletion = async (messages, options = {}) => {
  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: options.model || aiConfig.model,
      messages: messages,
      max_tokens: options.maxTokens || aiConfig.maxTokens,
      temperature: options.temperature || aiConfig.temperature,
    });

    const duration = Date.now() - startTime;
    const tokensUsed = response.usage?.total_tokens || 0;
    
    logger.info(`AI Request: ${tokensUsed} tokens, ${duration}ms`);
    
    return {
      success: true,
      message: response.choices[0].message.content,
      tokensUsed: tokensUsed,
      model: response.model,
    };
  } catch (error) {
    logger.error('OpenAI API Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'AI service temporarily unavailable',
    };
  }
};

/**
 * Get product recommendations from AI
 */
const getProductRecommendations = async (userQuery, products) => {
  const prompt = promptTemplates.productRecommendation(userQuery, products);
  
  const result = await getChatCompletion([
    { role: 'system', content: 'You are a helpful e-commerce shopping assistant.' },
    { role: 'user', content: prompt }
  ]);
  
  return result;
};

/**
 * Enhance product description using AI
 */
const enhanceProductDescription = async (productName, currentDesc) => {
  const prompt = promptTemplates.enhanceDescription(productName, currentDesc);
  
  const result = await getChatCompletion([
    { role: 'system', content: 'You are a professional e-commerce copywriter.' },
    { role: 'user', content: prompt }
  ]);
  
  return result;
};

/**
 * AI-powered customer support
 */
const getSupportResponse = async (userMessage, orderContext = null) => {
  const prompt = promptTemplates.customerSupport(userMessage, orderContext);
  
  const result = await getChatCompletion([
    { role: 'system', content: 'You are Flipkart customer support agent.' },
    { role: 'user', content: prompt }
  ]);
  
  return result;
};

/**
 * Smart search refinement
 */
const refineSearchQuery = async (userQuery, searchResults) => {
  const prompt = promptTemplates.searchRefinement(userQuery, searchResults);
  
  const result = await getChatCompletion([
    { role: 'system', content: 'You are a search optimization expert.' },
    { role: 'user', content: prompt }
  ], {
    temperature: 0.3, // Lower temperature for more consistent JSON output
  });
  
  // Try to parse JSON response
  try {
    if (result.success && result.message) {
      const jsonMatch = result.message.match(/\{.*\}/s);
      if (jsonMatch) {
        return { ...result, refined: JSON.parse(jsonMatch[0]) };
      }
    }
  } catch (e) {
    logger.warn('Failed to parse AI JSON response');
  }
  
  return result;
};

/**
 * Count tokens for cost estimation
 */
const countTokens = (text, model = 'gpt-4o-mini') => {
  const encoder = encoding_for_model(model);
  const tokens = encoder.encode(text);
  encoder.free();
  return tokens.length;
};

module.exports = {
  getChatCompletion,
  getProductRecommendations,
  enhanceProductDescription,
  getSupportResponse,
  refineSearchQuery,
  countTokens,
};