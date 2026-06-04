const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// Routes
app.use('/api/v1/auth', require('./routes/v1/auth.routes'));
app.use('/api/v1/products', require('./routes/v1/product.routes'));
app.use('/api/v1/cart', require('./routes/v1/cart.routes'));
app.use('/api/v1/orders', require('./routes/v1/order.routes'));

// Add this line with other route registrations
app.use('/api/v1/ai', require('./routes/v1/ai.routes'));


// Error handling
app.use(require('./middleware/error.middleware'));

module.exports = app;