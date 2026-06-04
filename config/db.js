'use strict';

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process on failure so the server never starts in a broken state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are defaults in Mongoose 6+, listed explicitly for clarity
      autoIndex: process.env.NODE_ENV !== 'production', // disable in prod for perf
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    // Log connection pool events in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.connection.on('disconnected', () =>
        console.warn('⚠️  MongoDB disconnected')
      );
      mongoose.connection.on('reconnected', () =>
        console.log('♻️  MongoDB reconnected')
      );
    }
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
