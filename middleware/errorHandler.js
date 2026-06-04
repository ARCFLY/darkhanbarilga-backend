'use strict';

const AppError = require('../utils/AppError');

// ─── Specific Mongoose / JWT error transformers ───────────────────────────────

/** Handle Mongoose CastError (e.g., invalid ObjectId format) */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: "${err.value}".`;
  return new AppError(message, 400);
};

/** Handle Mongoose duplicate key error (code 11000) */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: "${value}" for field "${field}". Please use a different value.`;
  return new AppError(message, 409);
};

/** Handle Mongoose ValidationError */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/** Handle JWT invalid signature */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

/** Handle JWT expiry */
const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

// ─── Response senders ─────────────────────────────────────────────────────────

/** Development: send full error details including stack trace */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/** Production: only send safe, operational error messages to the client */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Trusted, expected error — show message to client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error — don't leak details
    console.error('💥 UNEXPECTED ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
/**
 * Four-argument signature tells Express this is an error-handling middleware.
 * Must be registered LAST in app.js after all other routes and middleware.
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // Clone to avoid mutating original error
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    // Transform known library errors into friendly AppErrors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
