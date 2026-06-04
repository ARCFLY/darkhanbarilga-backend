'use strict';

// Load environment variables FIRST — before any other imports
require('dotenv').config({ path: `${__dirname}/.env` });

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

// ─── Validate critical environment variables ───────────────────────────────────
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `❌  Missing required environment variables: ${missingVars.join(', ')}\n` +
    `   Copy .env.example to .env and fill in the values.`
  );
  process.exit(1);
}

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Create HTTP server ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(
    `🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
/**
 * On unhandled promise rejection: log, then shut down gracefully.
 * This prevents the server from continuing in an unknown/broken state.
 */
process.on('unhandledRejection', (err) => {
  console.error('💥  UNHANDLED REJECTION! Shutting down...');
  console.error(`   ${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

/**
 * On uncaught synchronous exception: log and exit immediately.
 * (sync errors that escape try/catch — rare but fatal)
 */
process.on('uncaughtException', (err) => {
  console.error('💥  UNCAUGHT EXCEPTION! Shutting down...');
  console.error(`   ${err.name}: ${err.message}`);
  process.exit(1);
});

/**
 * On SIGTERM (e.g. from Docker/Kubernetes): finish in-flight requests,
 * then exit cleanly.
 */
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('✅  HTTP server closed. Process terminating.');
    process.exit(0);
  });
});

module.exports = server; // exported for integration testing
