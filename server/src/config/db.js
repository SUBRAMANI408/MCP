const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    try {
      const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 2000 // Fast fail for fallback
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (primaryError) {
      console.log(`[INFO] Local MongoDB not detected. Automatically provisioning isolated in-memory database for testing on port 27017...`);
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'sports' } });
      uri = mongoServer.getUri();
      
      const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`Fallback In-Memory MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
