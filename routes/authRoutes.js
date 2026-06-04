'use strict';

const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  logout,
  getMe,
  refreshToken,
  updatePassword,
} = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────
// No authentication required

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user or agent
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and receive JWT tokens
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Clear the auth cookie (client-side logout)
 * @access  Public (cookie is cleared regardless of token validity)
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Get a new access token using a refresh token
 * @access  Public (refresh token acts as the credential)
 */
router.post('/refresh-token', refreshToken);

// ─── Protected Routes ─────────────────────────────────────────────────────────
// verifyToken middleware is applied to all routes below

router.use(verifyToken); // apply once, covers all subsequent routes in this file

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 */
router.get('/me', getMe);

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update authenticated user's password
 * @access  Private
 */
router.patch('/update-password', updatePassword);

module.exports = router;
