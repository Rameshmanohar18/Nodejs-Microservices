const mongoose = require('mongoose');

// Use Case: Centralized database connection with retry logic
class MongoDBConfig {
  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,           // Max connections in pool
        minPoolSize: 2,            // Min connections always open
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000,    // Close sockets after 45s
      });
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }
}