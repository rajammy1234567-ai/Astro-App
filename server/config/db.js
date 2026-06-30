const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (process.env.USE_MEMORY_DB === 'true') {
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log('Using in-memory MongoDB (dev mode)');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;