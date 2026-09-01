const mongoose = require('mongoose');
const dns = require('dns');

// Ensure reliable DNS resolution for mongodb+srv:// SRV records (especially on Windows)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Gracefully fallback to system default resolver
}

/**
 * Maps Mongoose connection readyState codes to human-readable strings.
 */
const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Returns current database connection status.
 * @returns {string} Human-readable connection status
 */
const getDatabaseStatus = () => {
  return CONNECTION_STATES[mongoose.connection.readyState] || 'unknown';
};

/**
 * Checks whether the database connection is currently active.
 * @returns {boolean}
 */
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Validates the connection URI and registers event listeners for connection lifecycle.
 * @returns {Promise<boolean>} Resolves to true if connected, false otherwise.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.trim() === '' || mongoURI.includes('your_mongodb_connection_string') || mongoURI.includes('<db_password>')) {
    console.error('❌ [Database] Connection Error: MONGODB_URI is not configured or contains placeholder values.');
    console.warn('⚠️  [Database] Please set a valid MongoDB Atlas URI in server/.env.');
    return false;
  }

  // Register event listeners once to avoid duplicates on re-connections
  if (!mongoose.connection.listenerCount('error')) {
    mongoose.connection.on('error', (err) => {
      console.error('❌ [Database] Runtime Mongoose error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  [Database] Mongoose connection lost / disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ [Database] Mongoose reconnected to MongoDB Atlas.');
    });
  }

  try {
    console.log('⏳ [Database] Attempting connection to MongoDB Atlas...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ [Database] Successfully connected to MongoDB Atlas! Host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [Database] Connection failure: ${error.message}`);
    return false;
  }
};

/**
 * Gracefully closes the database connection.
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🔌 [Database] Mongoose connection closed gracefully.');
  }
};

module.exports = {
  connectDB,
  closeDB,
  getDatabaseStatus,
  isDatabaseConnected,
};
