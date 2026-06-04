'use strict';

/**
 * AppError — a custom Error class that carries an HTTP status code
 * and an `isOperational` flag so we can distinguish programmer errors
 * from expected, user-facing errors.
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx or 5xx)
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // helps global handler decide to show details

    // Capture stack trace, excluding this constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
