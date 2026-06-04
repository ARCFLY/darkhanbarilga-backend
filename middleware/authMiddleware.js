'use strict';

const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../utils/tokenUtils');

// ─── verifyToken ──────────────────────────────────────────────────────────────
/**
 * Middleware that validates the JWT included in the Authorization header
 * (Bearer scheme) or the `jwt` httpOnly cookie.
 *
 * On success, attaches `req.user` (the full Mongoose user document) and
 * `req.tokenPayload` (the raw decoded JWT payload).
 *
 * Rejects with 401 if:
 *  - No token is present
 *  - Token is malformed, expired, or signed with the wrong secret
 *  - The token's subject user no longer exists or is deactivated
 */
const verifyToken = catchAsync(async (req, _res, next) => {
  // 1. Extract token from header or cookie
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401)
    );
  }

  // 2. Verify token signature and expiry
  const decoded = verifyAccessToken(token); // throws AppError on failure

  // 3. Check that the user still exists in the database
  const currentUser = await User.findById(decoded.id).select('+password');

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4. Check that the account is active (not soft-deleted or suspended)
  if (!currentUser.isActive) {
    return next(
      new AppError('Your account has been deactivated. Please contact support.', 401)
    );
  }

  // 5. Attach decoded payload and user document for downstream middleware/controllers
  req.tokenPayload = decoded;
  req.user = currentUser;

  next();
});

// ─── isAgent ──────────────────────────────────────────────────────────────────
/**
 * Middleware (must be placed AFTER verifyToken) that restricts access to
 * users whose role is 'agent' (with an approved profile) OR 'admin'.
 *
 * Admins automatically pass all role checks.
 */
const isAgent = (req, _res, next) => {
  if (!req.user) {
    return next(
      new AppError('Authentication required. Please run verifyToken first.', 500)
    );
  }

  // Admins can do anything an agent can do
  if (req.user.role === 'admin') return next();

  if (req.user.role !== 'agent') {
    return next(
      new AppError('Access denied. This route is restricted to agents only.', 403)
    );
  }

  // Agents must have an approved profile
  if (
    !req.user.agentProfile ||
    req.user.agentProfile.approvalStatus !== 'approved'
  ) {
    return next(
      new AppError(
        'Your agent account is pending approval. Please wait for admin confirmation.',
        403
      )
    );
  }

  next();
};

// ─── isAdmin ──────────────────────────────────────────────────────────────────
/**
 * Middleware (must be placed AFTER verifyToken) that restricts access to
 * users whose role is 'admin'.
 */
const isAdmin = (req, _res, next) => {
  if (!req.user) {
    return next(
      new AppError('Authentication required. Please run verifyToken first.', 500)
    );
  }

  if (req.user.role !== 'admin') {
    return next(
      new AppError(
        'Access denied. You do not have permission to perform this action.',
        403
      )
    );
  }

  next();
};

// ─── restrictTo ───────────────────────────────────────────────────────────────
/**
 * Factory middleware that accepts one or more allowed roles.
 * More flexible than isAgent / isAdmin for routes that accept multiple roles.
 *
 * Usage: router.delete('/users/:id', verifyToken, restrictTo('admin'))
 *
 * @param {...string} roles - Allowed role strings
 * @returns {Function} Express middleware
 */
const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required. Please run verifyToken first.', 500)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
          403
        )
      );
    }

    next();
  };
};

// ─── optionalAuth ─────────────────────────────────────────────────────────────
/**
 * Optional authentication — attaches req.user if a valid token is present,
 * but does NOT throw if the token is absent. Useful for public routes that
 * display different content for authenticated vs. anonymous users.
 */
const optionalAuth = catchAsync(async (req, _res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(); // anonymous — continue without user

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
      req.tokenPayload = decoded;
    }
  } catch {
    // Invalid token — treat as anonymous, don't throw
  }

  next();
});

module.exports = {
  verifyToken,
  isAgent,
  isAdmin,
  restrictTo,
  optionalAuth,
};
