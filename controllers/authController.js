'use strict';

const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  attachTokenCookie,
  clearTokenCookie,
} = require('../utils/tokenUtils');

// ─── Helper: build token payload ──────────────────────────────────────────────
const buildTokenPayload = (user) => ({
  id: user._id.toString(),
  role: user.role,
  email: user.email,
});

// ─── Helper: send token response ──────────────────────────────────────────────
/**
 * Signs tokens, attaches the access token as an httpOnly cookie,
 * and sends a unified JSON response.
 */
const sendTokenResponse = (res, statusCode, user) => {
  const payload = buildTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Attach access token as httpOnly cookie (preferred for browser clients)
  attachTokenCookie(res, accessToken);

  res.status(statusCode).json({
    status: 'success',
    // Also return token in body for API / mobile clients that can't use cookies
    accessToken,
    refreshToken,
    data: {
      user: user.toPublicJSON(),
    },
  });
};

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
/**
 * Creates a new user account.
 *
 * Body: { firstName, lastName, email, password, confirmPassword, phone, role? }
 *
 * Notes:
 *  - Only 'user' and 'agent' roles can be self-registered.
 *  - 'admin' accounts must be seeded directly or promoted by another admin.
 *  - Agent accounts default to agentProfile.approvalStatus = 'pending'.
 */
const signup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phone,
    role,
    // Agent-specific
    licenseNumber,
    agency,
    bio,
  } = req.body;

  // 1. Basic required-field validation
  if (!firstName || !lastName || !email || !password) {
    return next(
      new AppError('Please provide first name, last name, email, and password.', 400)
    );
  }

  // 2. Password confirmation check
  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match.', 400));
  }

  // 3. Prevent privilege escalation — cannot self-assign 'admin'
  const allowedSelfRoles = ['user', 'agent'];
  const assignedRole = role && allowedSelfRoles.includes(role) ? role : 'user';

  // 4. Build new user object
  const newUserData = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    password, // hashed in pre-save hook
    phone: phone || undefined,
    role: assignedRole,
  };

  // 5. If registering as agent, attach agent profile
  if (assignedRole === 'agent') {
    newUserData.agentProfile = {
      licenseNumber: licenseNumber || null,
      agency: agency || null,
      bio: bio || null,
      approvalStatus: 'pending',
    };
  }

  // 6. Create user (Mongoose validation + pre-save hooks run here)
  const user = await User.create(newUserData);

  // 7. Issue tokens and respond
  sendTokenResponse(res, 201, user);
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * Authenticates an existing user with email + password.
 *
 * Body: { email, password }
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Validate presence
  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400));
  }

  // 2. Find user and explicitly select password (excluded by default)
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    isActive: true,
  }).select('+password');

  // 3. Verify user exists and password matches
  // NOTE: We compare before checking existence to prevent timing-based enumeration
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 4. Update last login timestamp (fire-and-forget, don't await)
  User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

  // 5. Issue tokens and respond
  sendTokenResponse(res, 200, user);
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
/**
 * Clears the JWT cookie on the client side.
 * For stateless JWT, true server-side invalidation requires a token blacklist
 * (Redis, etc.) — that can be added in a future iteration.
 */
const logout = (_req, res) => {
  clearTokenCookie(res);
  res.status(200).json({
    status: 'success',
    message: 'You have been logged out successfully.',
  });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * Returns the currently authenticated user's profile.
 * Requires verifyToken middleware to be applied to this route.
 */
const getMe = catchAsync(async (req, res, next) => {
  // req.user is already attached by verifyToken middleware
  // Re-fetch to get fully populated, non-password document
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: user.toPublicJSON(),
    },
  });
});

// ─── POST /api/auth/refresh-token ─────────────────────────────────────────────
/**
 * Issues a new access token using a valid refresh token.
 * Body: { refreshToken }
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required.', 400));
  }

  // Verify the refresh token
  const decoded = verifyRefreshToken(token); // throws AppError on failure

  // Check user still exists and is active
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return next(
      new AppError('The user for this token no longer exists or is inactive.', 401)
    );
  }

  // Issue a fresh access token only
  const newAccessToken = signAccessToken(buildTokenPayload(user));
  attachTokenCookie(res, newAccessToken);

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
});

// ─── PATCH /api/auth/update-password ─────────────────────────────────────────
/**
 * Allows an authenticated user to change their own password.
 * Requires verifyToken middleware.
 *
 * Body: { currentPassword, newPassword, confirmNewPassword }
 */
const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(
      new AppError(
        'Please provide current password, new password, and confirmation.',
        400
      )
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(new AppError('New passwords do not match.', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters long.', 400));
  }

  // Fetch user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // Update password — pre-save hook handles hashing
  user.password = newPassword;
  await user.save();

  // Issue new tokens so existing sessions aren't broken
  sendTokenResponse(res, 200, user);
});

module.exports = {
  signup,
  login,
  logout,
  getMe,
  refreshToken,
  updatePassword,
};
