const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

const PERSIST_DIR = path.join(__dirname, '..', '.data', 'mongo');

async function connectWithUri(uri, label) {
  const conn = await mongoose.connect(uri);
  console.log(`✅ MongoDB Connected (${label}): ${conn.connection.host}`);
  return conn;
}

async function startPersistentLocalDb() {
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
  memoryServer = await MongoMemoryServer.create({
    instance: { dbPath: PERSIST_DIR },
  });
  const uri = memoryServer.getUri();
  console.log('\n✅ PERSISTENT LOCAL DATABASE (disk par save)');
  console.log(`   Path: ${PERSIST_DIR}`);
  console.log('   Admin uploads restart ke baad bhi rahenge.\n');
  return connectWithUri(uri, 'local disk');
}

const connectDB = async () => {
  if (process.env.USE_MEMORY_DB === 'true') {
    return startPersistentLocalDb();
  }

  if (process.env.MONGODB_URI) {
    try {
      return await connectWithUri(process.env.MONGODB_URI, 'Atlas cloud');
    } catch (error) {
      console.error(`Atlas DB Error: ${error.message}`);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
    }
  }

  const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/astro-app';
  try {
    return await connectWithUri(localUri, 'local MongoDB');
  } catch (error) {
    console.warn(`Local MongoDB not available: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  }

  return startPersistentLocalDb();
};

module.exports = connectDB;