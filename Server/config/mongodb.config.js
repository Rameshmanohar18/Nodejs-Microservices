// const mongoose = require('mongoose');

// // Use Case: Centralized database connection with retry logic
// class MongoDBConfig {
//   async connect() {
//     try {
//       await mongoose.connect(process.env.MONGODB_URI, {
//         maxPoolSize: 10,           // Max connections in pool
//         minPoolSize: 2,            // Min connections always open
//         serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
//         socketTimeoutMS: 45000,    // Close sockets after 45s
//       });
//       console.log('✅ MongoDB connected');
//     } catch (error) {
//       console.error('❌ MongoDB connection failed:', error);
//       process.exit(1);
//     }
//   }
// }


import mongoose from 'mongoose';
import logger from '../logger/winston.config.js';

class MongoDBConnection {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      logger.info('Using existing database connection');
      return;
    }

    try {
      const options = {
        autoIndex: process.env.NODE_ENV !== 'production',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);

      this.isConnected = true;
      
      mongoose.connection.on('connected', () => {
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isConnectedToDatabase() {
    return this.isConnected;
  }
}

export default new MongoDBConnection();