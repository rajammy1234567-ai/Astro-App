const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

async function connectWithUri(uri, label) {
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB Connected (${label}): ${conn.connection.host}`);
  return conn;
}

async function startMemoryDb() {
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  console.warn('\n⚠️  IN-MEMORY DATABASE — admin uploads DELETE hote hain jab server band/restart hota hai!');
  console.warn('   Permanent fix: MongoDB Atlas me apna IP whitelist karo, phir USE_MEMORY_DB=false rakho.\n');
  return connectWithUri(uri, 'in-memory dev');
}

const connectDB = async () => {
  if (process.env.USE_MEMORY_DB === 'true') {
    return startMemoryDb();
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return startMemoryDb();
  }

  try {
    return await connectWithUri(uri, 'Atlas');
  } catch (error) {
    console.error(`Atlas DB Error: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
    return startMemoryDb();
  }
};

module.exports = connectDB;