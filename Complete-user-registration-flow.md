```js


// 1. Route receives request
router.post('/register', validateRegistration, authController.register);

// 2. Validation checks input
// src/validations/user.validation.js - validates email, password format

// 3. Controller handles request
// src/controllers/auth.controller.js
async register(req, res) {
// Call service
const result = await authService.registerUser(req.body);
res.json(result);
}

// 4. Service does business logic
// src/services/auth/auth.service.js
async registerUser(userData) {
// Check if user exists (Repository)
const existing = await userRepository.findByEmail(userData.email);
if (existing) throw new Error('User exists');

// Hash password (Utils)
const hashedPassword = await hashPassword(userData.password);

// Create user (Repository)
const user = await userRepository.create({
...userData,
password: hashedPassword
});

// Emit event (Events)
eventEmitter.emit('user.registered', user);

// Queue welcome email (Jobs)
await emailQueue.add('welcome', { email: user.email });

return user;
}

// 5. Repository queries DB
// src/repositories/user.repository.js
async create(userData) {
return await User.create(userData);
}

// 6. Events trigger background actions
// src/events/user.events.js
eventEmitter.on('user.registered', async (user) => {
await sendWelcomeEmail(user.email); // Job
await syncToCRM(user); // Service
await logToAnalytics(user); // Utils
await sendSMS(user.phone, 'Welcome'); // Job
});

// 7. Jobs process in background
// src/jobs/workers/email.worker.js
emailQueue.process('welcome', async (job) => {
await emailService.send(job.data.email, 'Welcome!');
});
```
