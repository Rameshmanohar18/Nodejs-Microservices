const OpenAI = require('openai');
const logger = require('./logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const aiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
};

// Validate API key on startup
const validateOpenAIConfig = () => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY is not set. AI features will not work.');
    return false;
  }
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    logger.error('Invalid OPENAI_API_KEY format');
    return false;
  }
  return true;
};

module.exports = {
  openai,
  aiConfig,
  validateOpenAIConfig,
};