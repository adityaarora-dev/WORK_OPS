const mongoose = require('mongoose');
const dns = require('dns');

// Ensure reliable DNS resolution for mongodb+srv:// SRV records
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  // Set custom DNS resolvers on Windows where local ISP/OS resolvers often fail SRV queries,
  // while preserving Linux/Docker/Render system resolvers in production.
  if (process.platform === 'win32' || process.env.FORCE_CUSTOM_DNS === 'true') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
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
 * Sanitizes and repairs common formatting anomalies in MongoDB URIs.
 * Handles:
 * - Accidental surrounding quotes ("...", '...', `...`)
 * - Leading variable assignment ("MONGODB_URI=..." or "MONGO_URI=...")
 * - Dropped '=' in query params (e.g., retryWritestrue -> retryWrites=true)
 * - Dropped '=' in w=majority (e.g., wmajority -> w=majority)
 * - HTML-encoded ampersands (&amp; -> &)
 * - Leading and trailing whitespace
 *
 * @param {string} rawUri - The raw connection string from environment
 * @returns {string} Sanitized MongoDB URI
 */
function sanitizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return '';
  let cleaned = rawUri.trim();

  // Strip leading/trailing escaped or unescaped quotes/backticks
  cleaned = cleaned.replace(/^(\\?['"`])+/g, '').replace(/(\\?['"`])+$/g, '').trim();

  // Strip leading variable assignment if user pasted "MONGODB_URI=..." or "MONGO_URI=..." into Render
  cleaned = cleaned.replace(/^(MONGODB_URI|MONGO_URI)\s*=\s*/i, '');

  // Strip again if quotes were after the variable name
  cleaned = cleaned.replace(/^(\\?['"`])+/g, '').replace(/(\\?['"`])+$/g, '').trim();

  // Repair missing '=' in query parameters (e.g., retryWritestrue -> retryWrites=true)
  cleaned = cleaned.replace(/retryWritestrue/gi, 'retryWrites=true');
  cleaned = cleaned.replace(/wmajority/gi, 'w=majority');

  // Fix HTML-encoded entities
  cleaned = cleaned.replace(/&amp;/g, '&');

  return cleaned;
}

/**
 * Returns a password-masked version of the MongoDB URI for safe diagnostic logging.
 * @param {string} uri
 * @returns {string} Masked URI string
 */
function maskMongoUri(uri) {
  if (!uri) return '[EMPTY]';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
}

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Validates the connection URI and registers event listeners for connection lifecycle.
 * @returns {Promise<boolean>} Resolves to true if connected, false otherwise.
 */
const connectDB = async () => {
  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const mongoURI = sanitizeMongoUri(rawUri);

  if (
    !mongoURI ||
    !mongoURI.startsWith('mongodb') ||
    mongoURI.includes('your_mongodb_connection_string') ||
    mongoURI.includes('<db_password>')
  ) {
    console.error('❌ [Database] Connection Error: MONGO_URI / MONGODB_URI is not configured or contains invalid/placeholder values.');
    console.warn('⚠️  [Database] Please set a valid MongoDB Atlas URI in server environment variables.');
    return false;
  }

  console.log(`🔌 [Database] Connecting to: ${maskMongoUri(mongoURI)}`);

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
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
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
  sanitizeMongoUri,
  maskMongoUri,
};
