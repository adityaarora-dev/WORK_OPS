const path = require('path');
const dotenv = require('dotenv');

// Load environment variables reliably regardless of working directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { connectDB, closeDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

/**
 * Boots the server and initializes the database connection.
 */
const startServer = async () => {
  console.log('--------------------------------------------------');
  console.log(' HR MANAGEMENT SYSTEM — BACKEND INITIALIZING');
  console.log('--------------------------------------------------');

  // Attempt database connection
  const dbConnected = await connectDB();

  if (!dbConnected) {
    console.warn('⚠️  [Server Warning] Database connection failed or MONGODB_URI is not set.');
    console.warn('⚠️  [Server Warning] The server will run in DEGRADED mode.');
    console.warn('⚠️  [Server Warning] Health check (/api/health) will report database as disconnected.');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('--------------------------------------------------');
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🩺 Health check URL:  http://localhost:${PORT}/api/health`);
    console.log(`📡 Database status:   ${dbConnected ? 'CONNECTED' : 'DISCONNECTED (Degraded)'}`);
    console.log('--------------------------------------------------');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ [Server Error] Port ${PORT} is already in use by another process.`);
      console.error(`❌ [Server Error] Please terminate the process using port ${PORT} or check running instances.`);
    } else {
      console.error('❌ [Server Error]:', err.message);
    }
  });

  // Graceful shutdown handler
  const handleShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await closeDB();
      console.log('👋 Process terminated cleanly.');
      process.exit(0);
    });

    // Force close after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('⚠️  Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
  });
};

startServer();
