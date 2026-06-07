Here's a **complete Jest automation guide** for your Flipkart Clone - from setup to all 6 modules with ready-to-run code.

## 📦 **Part 1: Installation & Setup**

### **Step 1: Install Dependencies**

```bash
npm install --save-dev jest supertest mongodb-memory-server cross-env
npm install --save bcryptjs jsonwebtoken dotenv
```

### **Step 2: Update package.json**

```json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test jest --testTimeout=30000 --runInBand",
    "test:watch": "cross-env NODE_ENV=test jest --watch",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["./tests/setup.js"],
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

### **Step 3: Create Test Setup File**

**`tests/setup.js`** - Runs before all tests:

```javascript
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

---

## 🧪 **Part 2: Module 1 - User Authentication Tests**

**`tests/user.test.js`**

```javascript
const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("User Module - Authentication", () => {
  test("POST /api/auth/register - Success", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Test@123",
      phone: "9876543210",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBeDefined();

    // Verify user saved in DB
    const user = await User.findOne({ email: "test@example.com" });
    expect(user).not.toBeNull();
    expect(user.name).toBe("Test User");
  });

  test("POST /api/auth/register - Duplicate Email", async () => {
    // First create a user
    await User.create({
      name: "Existing",
      email: "duplicate@example.com",
      password: "hashedpass123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "New User",
      email: "duplicate@example.com",
      password: "Test@123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Email already exists");
  });

  test("POST /api/auth/login - Success with valid credentials", async () => {
    // Create user first
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("CorrectPass123", 10);
    await User.create({
      name: "Login User",
      email: "login@example.com",
      password: hashedPassword,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "CorrectPass123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("login@example.com");
  });

  test("POST /api/auth/login - Invalid password", async () => {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("RealPass123", 10);
    await User.create({
      name: "Test",
      email: "wrongpass@example.com",
      password: hashedPassword,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "wrongpass@example.com",
      password: "WrongPass",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("GET /api/auth/profile - Protected route with valid token", async () => {
    // Create user and get token
    const user = await User.create({
      name: "Protected User",
      email: "protected@example.com",
      password: "hashed123",
    });

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("protected@example.com");
  });

  test("GET /api/auth/profile - No token provided", async () => {
    const res = await request(app).get("/api/auth/profile");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token provided");
  });
});
```

---

## 🛍️ **Part 3: Module 2 - Product Management Tests**

**`tests/product.test.js`**

```javascript
const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");
const User = require("../models/User");

describe("Product Module - CRUD Operations", () => {
  let adminToken, userToken;
  let productId;

  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    });

    // Create normal user
    const user = await User.create({
      name: "User",
      email: "user@example.com",
      password: "user123",
      role: "user",
    });

    const jwt = require("jsonwebtoken");
    adminToken = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
    );
    userToken = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
    );
  });

  test("POST /api/products - Admin can create product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "iPhone 14",
        price: 69999,
        description: "Latest Apple smartphone",
        category: "Electronics",
        brand: "Apple",
        stock: 50,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("iPhone 14");
    expect(res.body.price).toBe(69999);
    productId = res.body._id;
  });

  test("POST /api/products - User cannot create product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Test Product",
        price: 1000,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Admin access required");
  });

  test("GET /api/products - Get all products", async () => {
    // Create some products first
    await Product.create([
      { name: "Laptop", price: 50000, stock: 10 },
      { name: "Mouse", price: 500, stock: 100 },
    ]);

    const res = await request(app).get("/api/products");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("GET /api/products/:id - Get single product", async () => {
    const product = await Product.create({
      name: "Test Product",
      price: 1999,
      stock: 5,
    });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Test Product");
  });

  test("PUT /api/products/:id - Update product", async () => {
    const product = await Product.create({
      name: "Old Name",
      price: 1000,
      stock: 10,
    });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Name",
        price: 1500,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.price).toBe(1500);
  });

  test("DELETE /api/products/:id - Admin can delete", async () => {
    const product = await Product.create({
      name: "To Delete",
      price: 999,
    });

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    // Verify it's deleted from DB
    const deleted = await Product.findById(product._id);
    expect(deleted).toBeNull();
  });
});
```

---

## 🛒 **Part 4: Module 3 - Shopping Cart Tests**

**`tests/cart.test.js`**

```javascript
const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

describe("Cart Module - Shopping Cart Operations", () => {
  let token, userId, productId;

  beforeEach(async () => {
    // Create user
    const user = await User.create({
      name: "Cart User",
      email: "cart@example.com",
      password: "cart123",
    });
    userId = user._id;

    const jwt = require("jsonwebtoken");
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Create product
    const product = await Product.create({
      name: "Test Product",
      price: 1000,
      stock: 20,
    });
    productId = product._id;
  });

  test("POST /api/cart/add - Add item to cart", async () => {
    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: productId,
        quantity: 2,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.totalCartValue).toBe(2000); // 2 × 1000
  });

  test("GET /api/cart - Get user cart", async () => {
    // First add items to cart
    await Cart.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          items: { product: productId, quantity: 3, price: 1000 },
        },
      },
      { upsert: true },
    );

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items[0].quantity).toBe(3);
  });

  test("PUT /api/cart/update - Update quantity", async () => {
    // Setup cart first
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [{ product: productId, quantity: 1, price: 1000 }] },
      { upsert: true },
    );

    const res = await request(app)
      .put("/api/cart/update")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: productId,
        quantity: 5,
      });

    expect(res.statusCode).toBe(200);
    const updatedItem = res.body.items.find((i) => i.product === productId);
    expect(updatedItem.quantity).toBe(5);
    expect(res.body.totalCartValue).toBe(5000);
  });

  test("DELETE /api/cart/remove/:productId - Remove item", async () => {
    // Setup cart with item
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [{ product: productId, quantity: 2, price: 1000 }] },
      { upsert: true },
    );

    const res = await request(app)
      .delete(`/api/cart/remove/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(0);
    expect(res.body.totalCartValue).toBe(0);
  });

  test("POST /api/cart/add - Quantity exceeds stock", async () => {
    // Update product stock to low
    await Product.findByIdAndUpdate(productId, { stock: 1 });

    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: productId,
        quantity: 10,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Insufficient stock");
  });
});
```

---

## 📦 **Part 5: Module 4 - Order Tests**

**`tests/order.test.js`**

```javascript
const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

describe("Order Module - Order Processing", () => {
  let token, userId, productId;

  beforeEach(async () => {
    const user = await User.create({
      name: "Order User",
      email: "order@example.com",
      password: "order123",
    });
    userId = user._id;

    const jwt = require("jsonwebtoken");
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const product = await Product.create({
      name: "Order Product",
      price: 500,
      stock: 100,
    });
    productId = product._id;

    // Add to cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [{ product: productId, quantity: 3, price: 500 }] },
      { upsert: true },
    );
  });

  test("POST /api/orders - Create order from cart", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: "123 Test St",
          city: "Mumbai",
          pincode: "400001",
          phone: "9876543210",
        },
        paymentMethod: "COD",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.totalAmount).toBe(1500); // 3 × 500
    expect(res.body.status).toBe("Pending");

    // Verify stock decreased
    const updatedProduct = await Product.findById(productId);
    expect(updatedProduct.stock).toBe(97); // 100 - 3
  });

  test("GET /api/orders/myorders - Get user orders", async () => {
    // Create orders first
    await Order.create([
      {
        user: userId,
        items: [{ product: productId, quantity: 1, price: 500 }],
        totalAmount: 500,
        status: "Delivered",
      },
      {
        user: userId,
        items: [{ product: productId, quantity: 2, price: 500 }],
        totalAmount: 1000,
        status: "Processing",
      },
    ]);

    const res = await request(app)
      .get("/api/orders/myorders")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].totalAmount).toBeDefined();
  });

  test("PUT /api/orders/:orderId/cancel - Cancel order", async () => {
    // Create order
    const order = await Order.create({
      user: userId,
      items: [{ product: productId, quantity: 2, price: 500 }],
      totalAmount: 1000,
      status: "Pending",
    });

    // Decrease stock for testing
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -2 } });

    const res = await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Cancelled");

    // Verify stock restored
    const product = await Product.findById(productId);
    expect(product.stock).toBe(100); // Back to original
  });

  test("POST /api/orders - Empty cart validation", async () => {
    // Empty cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: { city: "Test" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Cart is empty");
  });
});
```

---

## 💳 **Part 6: Module 5 - Payment Tests with Mocks**

**`tests/payment.test.js`**

```javascript
const request = require("supertest");
const app = require("../app");
const Order = require("../models/Order");
const User = require("../models/User");

// Mock Razorpay
jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({ id: "mock_order_id" }),
    },
    payments: {
      fetch: jest.fn().mockResolvedValue({ status: "captured" }),
    },
  }));
});

describe("Payment Module - Payment Processing", () => {
  let token, orderId;

  beforeEach(async () => {
    const user = await User.create({
      name: "Payment User",
      email: "payment@example.com",
      password: "pay123",
    });

    const jwt = require("jsonwebtoken");
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const order = await Order.create({
      user: user._id,
      items: [{ product: "product123", quantity: 1, price: 1000 }],
      totalAmount: 1000,
      status: "Pending",
    });
    orderId = order._id;
  });

  test("POST /api/payments/initiate - Create payment order", async () => {
    const res = await request(app)
      .post("/api/payments/initiate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        orderId: orderId,
        paymentMethod: "Card",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.paymentId).toBeDefined();
    expect(res.body.amount).toBe(1000);
    expect(res.body.status).toBe("Pending");
    expect(res.body.razorpayOrderId).toBe("mock_order_id");
  });

  test("POST /api/payments/verify - Successful payment verification", async () => {
    const res = await request(app).post("/api/payments/verify").send({
      paymentId: "pay_test123",
      orderId: orderId,
      signature: "valid_signature",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Success");

    // Verify order status updated
    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder.status).toBe("Paid");
  });

  test("POST /api/payments/fail - Payment failure handling", async () => {
    const res = await request(app).post("/api/payments/fail").send({
      paymentId: "pay_failed",
      orderId: orderId,
      reason: "Insufficient funds",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe("Failed");

    // Order status should remain pending
    const order = await Order.findById(orderId);
    expect(order.status).toBe("Pending");
  });

  test("POST /api/payments/webhook - Razorpay webhook simulation", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .send({
        event: "payment.captured",
        payload: {
          payment: { entity: { id: "pay_webhook", amount: 1000 } },
          order: { entity: { id: "order_webhook" } },
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
```

---

## 🔍 **Part 7: Module 6 - Search & Filter Tests**

**`tests/search.test.js`**

```javascript
const request = require("supertest");
const app = require("../app");
const Product = require("../models/Product");

describe("Search Module - Product Search & Filters", () => {
  beforeEach(async () => {
    // Create diverse products for testing
    await Product.create([
      {
        name: "iPhone 14",
        price: 69999,
        category: "Electronics",
        brand: "Apple",
        rating: 4.5,
      },
      {
        name: "Samsung Galaxy S23",
        price: 64999,
        category: "Electronics",
        brand: "Samsung",
        rating: 4.3,
      },
      {
        name: "Nike Air Max",
        price: 8999,
        category: "Footwear",
        brand: "Nike",
        rating: 4.7,
      },
      {
        name: "Sony Headphones",
        price: 2999,
        category: "Electronics",
        brand: "Sony",
        rating: 4.2,
      },
      {
        name: "Adidas T-Shirt",
        price: 1299,
        category: "Clothing",
        brand: "Adidas",
        rating: 4.0,
      },
    ]);
  });

  test("GET /api/search - Basic keyword search", async () => {
    const res = await request(app).get("/api/search?q=iphone");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toContain("iPhone");
  });

  test("GET /api/search - Case insensitive search", async () => {
    const res = await request(app).get("/api/search?q=IPHONE");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("GET /api/search - Partial match", async () => {
    const res = await request(app).get("/api/search?q=sams");

    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toContain("Samsung");
  });

  test("GET /api/search?category=Electronics - Filter by category", async () => {
    const res = await request(app).get("/api/search?category=Electronics");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(3);
    res.body.forEach((product) => {
      expect(product.category).toBe("Electronics");
    });
  });

  test("GET /api/products?minPrice=5000&maxPrice=10000 - Price range filter", async () => {
    const res = await request(app).get(
      "/api/products?minPrice=5000&maxPrice=10000",
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].price).toBe(8999);
  });

  test("GET /api/products?sort=price&order=desc - Sorting", async () => {
    const res = await request(app).get("/api/products?sort=price&order=desc");

    expect(res.statusCode).toBe(200);
    const prices = res.body.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test("GET /api/products?rating=4.5 - Filter by minimum rating", async () => {
    const res = await request(app).get("/api/products?minRating=4.5");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    res.body.forEach((product) => {
      expect(product.rating).toBeGreaterThanOrEqual(4.5);
    });
  });

  test("GET /api/products?page=1&limit=2 - Pagination", async () => {
    const res = await request(app).get("/api/products?page=1&limit=2");

    expect(res.statusCode).toBe(200);
    expect(res.body.products.length).toBe(2);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.totalPages).toBe(3); // 5 total / 2 per page
    expect(res.body.totalProducts).toBe(5);
  });

  test("GET /api/search?brand=Apple - Filter by brand", async () => {
    const res = await request(app).get("/api/search?brand=Apple");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].brand).toBe("Apple");
  });

  test("GET /api/search - No results", async () => {
    const res = await request(app).get("/api/search?q=nonexistentproduct123");

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);
  });
});
```

---

## 🚀 **Part 8: Running Tests & Advanced Features**

### **1. Run All Tests**

```bash
npm test
```

### **2. Run Specific Module**

```bash
npm test -- user.test.js
npm test -- product.test.js
```

### **3. Run with Coverage Report**

```bash
npm run test:coverage
```

### **4. Watch Mode (Auto-run on changes)**

```bash
npm run test:watch
```

---

## 📊 **Sample Test Output**

```
PASS  tests/user.test.js
  User Module - Authentication
    ✓ POST /api/auth/register - Success (45ms)
    ✓ POST /api/auth/register - Duplicate Email (32ms)
    ✓ POST /api/auth/login - Success (28ms)
    ✓ GET /api/auth/profile - Protected route (35ms)

PASS  tests/product.test.js
  Product Module - CRUD Operations
    ✓ POST /api/products - Admin can create product (52ms)
    ✓ GET /api/products - Get all products (28ms)

Test Suites: 6 passed, 6 total
Tests:       26 passed, 26 total
Time:        8.234 s
```

---

## 💡 **Pro Tips for Jest Automation**

1. **Database Isolation**: Each test runs in fresh DB (no data conflicts)
2. **Mock External APIs**: Use `jest.mock()` for payment gateways
3. **Test Hooks**: `beforeEach`/`afterEach` for clean state
4. **Environment Variables**: Use `.env.test` for test-specific configs

**`.env.test` file**:

```env
NODE_ENV=test
JWT_SECRET=test_secret_key
MONGODB_URI=mongodb://localhost:27017/test
```

Want me to provide the **Express.js controller code** that makes these tests pass?
