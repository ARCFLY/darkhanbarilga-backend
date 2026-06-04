'use strict';

/**
 * catchAsync — wraps an async Express route handler and forwards
 * any rejected promise to Express's next() error handler.
 *
 * Usage:
 *   router.get('/path', catchAsync(async (req, res, next) => { ... }));
 *
 * @param {Function} fn - async Express handler (req, res, next) => Promise
 * @returns {Function} - Express middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
