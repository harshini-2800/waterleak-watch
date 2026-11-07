import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/waterleak-watch';
  
  // If in test mode and no external DB, or if explicitly requested memory mode
  if (process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test') {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      logger.info(`Connected to in-memory MongoDB: ${memUri}`);
      return;
    } catch (memErr) {
      logger.warn(`Could not start MongoMemoryServer: ${memErr.message}. Falling back to default URI.`);
    }
  }

  try {
    // Attempt standard connection with a short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    logger.info(`Successfully connected to MongoDB at ${uri}`);
  } catch (err) {
    logger.warn(`Could not connect to external MongoDB at ${uri} (${err.message}). Starting automatic in-memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      logger.info(`Started and connected to in-memory MongoDB at ${memUri}`);
    } catch (fallbackErr) {
      logger.error(`Fatal: Failed to connect to both external and in-memory MongoDB:`, fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    logger.info('Disconnected from MongoDB.');
  } catch (err) {
    logger.error('Error during MongoDB disconnect:', err);
  }
}

