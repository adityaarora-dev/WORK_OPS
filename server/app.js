const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const dotenv = require('dotenv');
const routes = require('./src/routes');
const { notFoundHandler, errorHandler } = require('./src/middlewares/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Security HTTP Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin API calls from frontend
    crossOriginEmbedderPolicy: false,
  })
);

// Rate Limiting (Protects API and prevents brute-force abuse)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // 1500 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after a few minutes.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 min for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// CORS configuration - flexible and resilient origin matching across Render & Vercel
const rawOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
];

if (rawOrigins.length === 0) {
  rawOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

const configuredOrigins = rawOrigins
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, server-to-server, or health monitors)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');

    // Allow all localhost, 127.0.0.1, and loopback ports
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(normalizedOrigin);
    // Allow any Vercel deployment (*.vercel.app)
    const isVercel = normalizedOrigin.endsWith('.vercel.app');

    if (isLocalhost || isVercel || configuredOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Gracefully reject disallowed origins without crashing the server
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

// Global Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Apply Rate Limiters
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Root route for basic server check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HR Management System API',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api', routes);
// Direct alias support for /auth/* endpoints
app.use('/auth', require('./src/routes/auth.routes'));

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
