'use strict';

const User = require('../models/User');
const Property = require('../models/Property');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../utils/tokenUtils');

const extractBearer = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.split(' ')[1];
};

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
const getStats = catchAsync(async (_req, res) => {
  const [users, agents, properties, appointments] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'agent' }),
    Property.countDocuments({}),
    Appointment.countDocuments({ status: 'pending' }),
  ]);

  res.status(200).json({
    status: 'success',
    stats: {
      users: { total: users, newLast7Days: null },
      agents: { total: agents, pending: await User.countDocuments({ role: 'agent', 'agentProfile.approvalStatus': 'pending' }), approved: await User.countDocuments({ role: 'agent', 'agentProfile.approvalStatus': 'approved' }), rejected: await User.countDocuments({ role: 'agent', 'agentProfile.approvalStatus': 'rejected' }) },
      properties: { total: properties, available: await Property.countDocuments({ status: 'available' }), sold: await Property.countDocuments({ status: 'sold' }), rented: await Property.countDocuments({ status: 'rented' }) },
      appointments: { pending: appointments },
    },
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getUsers = catchAsync(async (req, res, next) => {
  const token = extractBearer(req);
  if (!token) return next(new AppError('Authorization token required', 401));

  const decoded = verifyAccessToken(token);
  if (decoded.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }

  const { role, page = '1', limit = '20', search } = req.query;
  const filter = {};
  if (role) filter.role = role;

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { firstName: { $regex: escaped, $options: 'i' } },
      { lastName: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    },
    users,
  });
});

// ─── PATCH /api/admin/agents/:id/approve ─────────────────────────────────────
const approveAgent = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'agent') {
    return next(new AppError('Agent user not found', 404));
  }

  user.agentProfile = user.agentProfile || {};
  user.agentProfile.approvalStatus = 'approved';
  user.agentProfile.approvedAt = new Date();
  user.agentProfile.approvedBy = req.user._id;
  await user.save();

  res.status(200).json({
    status: 'success',
    user: user.toPublicJSON(),
  });
});

// ─── PATCH /api/admin/agents/:id/reject ──────────────────────────────────────
const rejectAgent = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'agent') {
    return next(new AppError('Agent user not found', 404));
  }

  user.agentProfile = user.agentProfile || {};
  user.agentProfile.approvalStatus = 'rejected';
  delete user.agentProfile.approvedAt;
  delete user.agentProfile.approvedBy;
  await user.save();

  res.status(200).json({
    status: 'success',
    user: user.toPublicJSON(),
  });
});

// ─── PATCH /api/admin/users/:id/deactivate ───────────────────────────────────
const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    status: 'success',
    user: user.toPublicJSON(),
  });
});

module.exports = {
  getStats,
  getUsers,
  approveAgent,
  rejectAgent,
  deactivateUser,
};
