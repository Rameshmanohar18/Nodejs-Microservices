const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redisMock = require('redis-mock');
const { config } = require('dotenv');

// Load test environment
config({ path: '.env.test' });

let mongod;

// Mock Redis
jest.mock('redis', () => redisMock);

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }],
          usage: { total_tokens: 100 }
        })
      }
    }
  }))
}));

// Global setup before all tests
beforeAll(async () => {
  // In-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Global teardown
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});