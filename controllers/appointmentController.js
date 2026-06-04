'use strict';

const Appointment = require('../models/Appointment');
const Property = require('../models/Property');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../utils/tokenUtils');

const extractBearer = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.split(' ')[1];
};

const authorizeAgentOrAdmin = async (agentId, actorToken) => {
  if (!actorToken) return;
  const decoded = verifyAccessToken(actorToken);
  if (decoded.role === 'admin') return;
  if (decoded.role === 'agent' && String(agentId) === String(decoded.id)) return;
  throw new AppError('You are not authorized for this action', 403);
};

// ─── POST /api/appointments ───────────────────────────────────────────────────
const createAppointment = catchAsync(async (req, res, next) => {
  const actorToken = extractBearer(req);
  if (!actorToken) return next(new AppError('Authentication required', 401));

  const decoded = verifyAccessToken(actorToken);

  const { propertyId, requestedDate, meetingType, userMessage } = req.body;

  if (!propertyId || !requestedDate) {
    return next(new AppError('propertyId and requestedDate are required', 400));
  }

  const appointmentDate = new Date(requestedDate);
  if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
    return next(new AppError('Appointment date must be in the future', 400));
  }

  const property = await Property.findById(propertyId);
  if (!property) return next(new AppError('Property not found', 404));

  // Users book for themselves; agents can book on behalf of users if needed
  const bookerId = decoded.role === 'user' || decoded.role === 'admin' ? decoded.id : null;
  if (!bookerId && decoded.role === 'agent') {
    return next(new AppError('Please login as customer to book appointment', 403));
  }

  // Prevent too-close duplicate for the same user + property + requested date
  const now = new Date();
  const thirtyMinutesBefore = new Date(appointmentDate.getTime() - 30 * 60 * 1000);
  const existing = await Appointment.findOne({
    user: bookerId,
    property: propertyId,
    requestedDate: { $gte: thirtyMinutesBefore, $lt: appointmentDate },
    status: { $in: ['pending', 'approved'] },
  });

  if (existing) {
    return next(new AppError('You already have an appointment close to this time', 409));
  }

  const appointment = await Appointment.create({
    user: bookerId,
    agent: property.assignedAgent,
    property: propertyId,
    requestedDate: appointmentDate,
    durationMinutes: 60,
    meetingType: meetingType || 'in_person',
    userMessage: userMessage || null,
  });

  await appointment.populate('user', 'firstName lastName email phone avatar');
  await appointment.populate('agent', 'firstName lastName email phone avatar agentProfile');
  await appointment.populate('property', 'title location.city location.district images price');

  res.status(201).json({
    status: 'success',
    appointment,
  });
});

// ─── GET /api/appointments/my-appointments ───────────────────────────────────
const getMyAppointments = catchAsync(async (req, res, next) => {
  const token = extractBearer(req);
  if (!token) return next(new AppError('Authorization token required', 401));

  const decoded = verifyAccessToken(token);
  const appointments = await Appointment.findUpcomingForUser(decoded.id);

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    appointments,
  });
});

// ─── GET /api/appointments/agent-schedule ────────────────────────────────────
const getAgentSchedule = catchAsync(async (req, res, next) => {
  const token = extractBearer(req);
  if (!token) return next(new AppError('Authorization token required', 401));

  const decoded = verifyAccessToken(token);
  if (decoded.role !== 'agent' && decoded.role !== 'admin') {
    return next(new AppError('Only agents and admins can view schedule', 403));
  }

  const agentId = decoded.role === 'admin' ? (decoded.adminViewAgentId || decoded.id) : decoded.id;

  const appointments = await Appointment.findUpcomingForAgent(agentId);

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    appointments,
  });
});

// ─── PATCH /api/appointments/:id/approve ─────────────────────────────────────
const approveAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { confirmedDate } = req.body;

  const appointment = await Appointment.findById(id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  const token = extractBearer(req);
  const decoded = verifyAccessToken(token);
  if (decoded.role !== 'admin' && String(appointment.agent) !== String(decoded.id)) {
    return next(new AppError('Only the assigned agent or admin can approve appointments', 403));
  }

  appointment.status = 'approved';
  if (confirmedDate) appointment.confirmedDate = new Date(confirmedDate);
  await appointment.save();

  await appointment.populate('user', 'firstName lastName email phone avatar');
  await appointment.populate('agent', 'firstName lastName email phone avatar agentProfile');
  await appointment.populate('property', 'title location.city location.district images price');

  res.status(200).json({
    status: 'success',
    appointment,
  });
});

// ─── PATCH /api/appointments/:id/cancel ──────────────────────────────────────
const cancelAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { cancellationReason } = req.body;

  const appointment = await Appointment.findById(id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  const token = extractBearer(req);
  const decoded = verifyAccessToken(token);

  const isUser = decoded.role === 'user' && String(appointment.user) === String(decoded.id);
  const isAgent = decoded.role === 'agent' && String(appointment.agent) === String(decoded.id);
  const isAdmin = decoded.role === 'admin';

  if (!isUser && !isAgent && !isAdmin) {
    return next(new AppError('You are not authorized to cancel this appointment', 403));
  }

  if (!['pending', 'approved'].includes(appointment.status)) {
    return next(new AppError('Only pending or approved appointments can be cancelled', 400));
  }

  appointment.status = 'cancelled';
  appointment.cancelledBy = decoded.id;
  appointment.cancellationReason = cancellationReason || null;

  await appointment.save();

  res.status(200).json({
    status: 'success',
    appointment,
  });
});

// ─── PATCH /api/appointments/:id/complete ────────────────────────────────────
const completeAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  const token = extractBearer(req);
  const decoded = verifyAccessToken(token);
  if (decoded.role !== 'admin' && String(appointment.agent) !== String(decoded.id)) {
    return next(new AppError('Only the assigned agent or admin can complete appointments', 403));
  }

  appointment.status = 'completed';
  await appointment.save();

  res.status(200).json({
    status: 'success',
    appointment,
  });
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAgentSchedule,
  approveAppointment,
  cancelAppointment,
  completeAppointment,
};
