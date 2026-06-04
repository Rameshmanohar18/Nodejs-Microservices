const request = require('supertest');
const app = require('../../src/app');
const { setupDB, getAuthToken } = require('../helpers/dbHelper');
const { mockProduct } = require('../fixtures/products.json');

describe('Product Integration Tests', () => {
  let adminToken;
  
  beforeAll(async () => {
    await setupDB();
    adminToken = await getAuthToken({ role: 'admin' });
  });
  
  test('POST /api/v1/products - Create product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(mockProduct);
      
    expect(res.statusCode).toBe(201);
  });
});