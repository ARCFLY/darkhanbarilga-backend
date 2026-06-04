'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

/**
 * Signs and returns a short-lived access token.
 *
 * @param {string|Object} payload - Data to encode (typically user id + role)
 * @returns {string} Signed JWT access token
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'realestate-app',
    audience: 'realestate-client',
  });
};

/**
 * Signs and returns a long-lived refresh token.
 *
 * @param {string|Object} payload
 * @returns {string} Signed JWT refresh token
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'realestate-app',
    audience: 'realestate-client',
  });
};

/**
 * Verifies an access token and returns its decoded payload.
 * Throws an AppError on failure so controllers don't need try/catch.
 *
 * @param {string} token
 * @returns {Object} Decoded JWT payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'realestate-app',
      audience: 'realestate-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token. Please log in again.', 401);
    }
    throw new AppError('Token verification failed.', 401);
  }
};

/**
 * Verifies a refresh token.
 *
 * @param {string} token
 * @returns {Object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'realestate-app',
      audience: 'realestate-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired. Please log in again.', 401);
    }
    throw new AppError('Invalid refresh token. Please log in again.', 401);
  }
};

/**
 * Attaches the access token as an httpOnly cookie on the response.
 *
 * @param {Response} res  - Express response object
 * @param {string}   token - JWT access token string
 */
const attachTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true, // not accessible via JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
  res.cookie('jwt', token, cookieOptions);
};

/**
 * Clears the auth cookie (used on logout).
 *
 * @param {Response} res
 */
const clearTokenCookie = (res) => {
  res.cookie('jwt', 'logged_out', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 10 * 1000, // 10 seconds — just to overwrite
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  attachTokenCookie,
  clearTokenCookie,
};
