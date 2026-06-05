const Joi = require('joi');

// Use Case: User registration validation
const validateRegistration = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain uppercase, lowercase, and number')
      .required(),
    age: Joi.number().min(18).max(120),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    referralCode: Joi.string().alphanum().length(8)
  });
  
  return schema.validate(data);
};

// Use Case: Order validation
const validateOrder = (data) => {
  const schema = Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().min(1).max(100).required()
      })
    ).min(1).required(),
    
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      pincode: Joi.string().length(6).required()
    }).required(),
    
    paymentMethod: Joi.string().valid('COD', 'Card', 'UPI').required(),
    couponCode: Joi.string().optional()
  });
  
  return schema.validate(data);
};

// Use Case: Search query validation
const validateSearch = (data) => {
  const schema = Joi.object({
    q: Joi.string().min(1).max(100),
    category: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.string().valid('price', 'rating', 'newest')
  });
  
  return schema.validate(data);
};


// 📊 Complete Use Case Matrix
// Folder	When to Use	Example Scenario	Response Time
// Config	Application startup	Connect to database	N/A
// Models	Define data structure	User schema with validation	N/A
// Controllers	Handle HTTP requests	API endpoint logic	<50ms
// Services	Business logic	Calculate order total	<100ms
// Repositories	Database queries	Get user with caching	<50ms
// Middleware	Cross-cutting concerns	Authentication check	<10ms
// Utils	Helper functions	Format currency	<1ms
// Jobs	Background tasks	Send 1000 emails	Async
// Events	Decoupled communication	Order placed triggers 5 actions	Async
// Validations	Input checking	Validate email format	<5ms


// // 1. Route receives request
// router.post('/register', validateRegistration, authController.register);

// // 2. Validation checks input
// // src/validations/user.validation.js - validates email, password format

// // 3. Controller handles request
// // src/controllers/auth.controller.js
// async register(req, res) {
//   // Call service
//   const result = await authService.registerUser(req.body);
//   res.json(result);
// }

// // 4. Service does business logic
// // src/services/auth/auth.service.js
// async registerUser(userData) {
//   // Check if user exists (Repository)
//   const existing = await userRepository.findByEmail(userData.email);
//   if (existing) throw new Error('User exists');
  
//   // Hash password (Utils)
//   const hashedPassword = await hashPassword(userData.password);
  
//   // Create user (Repository)
//   const user = await userRepository.create({
//     ...userData,
//     password: hashedPassword
//   });
  
//   // Emit event (Events)
//   eventEmitter.emit('user.registered', user);
  
//   // Queue welcome email (Jobs)
//   await emailQueue.add('welcome', { email: user.email });
  
//   return user;
// }

// // 5. Repository queries DB
// // src/repositories/user.repository.js
// async create(userData) {
//   return await User.create(userData);
// }

// // 6. Events trigger background actions
// // src/events/user.events.js
// eventEmitter.on('user.registered', async (user) => {
//   await sendWelcomeEmail(user.email);      // Job
//   await syncToCRM(user);                   // Service
//   await logToAnalytics(user);              // Utils
//   await sendSMS(user.phone, 'Welcome');    // Job
// });

// // 7. Jobs process in background
// // src/jobs/workers/email.worker.js
// emailQueue.process('welcome', async (job) => {
//   await emailService.send(job.data.email, 'Welcome!');
// });








// VALIDATIONS Folder - Input Validation
// What it does: Ensures incoming data is correct before processing
// Use Cases:

// ✅ Validate email format

// ✅ Check password strength

// ✅ Verify date ranges

// ✅ Sanitize user input