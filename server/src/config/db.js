const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[FATAL] MONGODB_URI is not set. Cannot start in production without a database.');
        process.exit(1);
      }
      uri = 'mongodb://localhost:27017/sports_association';
      console.warn('[WARN] MONGODB_URI not set, defaulting to localhost.');
    }

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 2000
      });
      console.log(`MongoDB Connected: ${conn.connection.host || conn.connection.name || 'localhost'}`);
    } catch (primaryError) {
      // In production, fail loudly — no fallback
      if (process.env.NODE_ENV === 'production') {
        console.error(`[FATAL] MongoDB connection failed: ${primaryError.message}`);
        console.error('Ensure MONGODB_URI points to a running MongoDB/Atlas instance.');
        process.exit(1);
      }

      // In development, only use memory-server if explicitly allowed
      if (process.env.ALLOW_MEMORY_DB !== 'true') {
        console.error(`[ERROR] MongoDB connection failed: ${primaryError.message}`);
        console.error('Set ALLOW_MEMORY_DB=true in .env to enable the in-memory fallback for development.');
        process.exit(1);
      }

      console.log('[INFO] Local MongoDB not detected. Provisioning in-memory database for development...');

      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'sports' } });
      uri = mongoServer.getUri();
      if (!uri.includes('/sports')) {
        uri = uri.replace(/\/?$/, '/sports');
      }

      const conn = await mongoose.connect(uri);
      console.log(`[DEV] In-Memory MongoDB Connected: ${conn.connection.host || conn.connection.name || 'localhost'}`);
    }
  } catch (error) {
    console.error(`[FATAL] MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
