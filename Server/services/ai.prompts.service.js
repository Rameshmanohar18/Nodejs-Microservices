/**
 * Prompt templates for different AI use cases
 */
const promptTemplates = {
  // Product recommendation based on user query
  productRecommendation: (userQuery, products) => `
You are a shopping assistant for Flipkart. 
User asks: "${userQuery}"

Available products:
${products.map(p => `- ${p.name}: ₹${p.price} (${p.category})`).join('\n')}

Provide:
1. Top 3 product recommendations with reasons
2. Keep response under 100 words
3. Be helpful and conversational
`,

  // Product description enhancement
  enhanceDescription: (productName, currentDesc) => `
Enhance this product description for e-commerce:
Product: ${productName}
Current: ${currentDesc}

Make it:
- SEO-friendly
- Persuasive for buyers
- Include key features
- Max 150 words
`,

  // Customer support response
  customerSupport: (userMessage, orderContext) => `
You are Flipkart customer support.
User message: "${userMessage}"
Order context: ${orderContext || 'No specific order'}

Respond:
- Professionally and helpfully
- Offer specific solutions
- Max 100 words
`,

  // Smart search refinement
  searchRefinement: (userQuery, searchResults) => `
User searched: "${userQuery}"
Found: ${searchResults.length} products

Suggest refined search terms to help user find better results.
Return only JSON: { "refinedTerms": ["term1", "term2"], "category": "suggested category" }
`,
};

module.exports = promptTemplates;