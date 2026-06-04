'use strict';

const mongoose = require('mongoose');

// ─── Appointment Schema ───────────────────────────────────────────────────────
const appointmentSchema = new mongoose.Schema(
  {
    // ── References ────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent ID is required'],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
    },

    // ── Scheduling ────────────────────────────────────────────────────────────
    requestedDate: {
      type: Date,
      required: [true, 'Requested appointment date/time is required'],
      validate: {
        validator: function (value) {
          // Must be a future date
          return value > new Date();
        },
        message: 'Appointment date must be in the future',
      },
    },
    confirmedDate: {
      // Agent may confirm a different time than initially requested
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: [15, 'Appointment must be at least 15 minutes'],
      max: [480, 'Appointment cannot exceed 8 hours'],
    },

    // ── Status & Lifecycle ────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'cancelled', 'completed', 'no_show'],
        message: '"{VALUE}" is not a valid appointment status',
      },
      default: 'pending',
    },

    // ── Communication ─────────────────────────────────────────────────────────
    userMessage: {
      // Message from user when booking
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: null,
    },
    agentNotes: {
      // Private notes from agent (not visible to user)
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },

    // ── Approval Tracking ─────────────────────────────────────────────────────
    approvedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // ── Meeting Format ────────────────────────────────────────────────────────
    meetingType: {
      type: String,
      enum: {
        values: ['in_person', 'virtual', 'phone'],
        message: '"{VALUE}" is not a valid meeting type',
      },
      default: 'in_person',
    },
    meetingLink: {
      // For virtual meetings
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
appointmentSchema.index({ user: 1, status: 1 });
appointmentSchema.index({ agent: 1, status: 1 });
appointmentSchema.index({ property: 1 });
appointmentSchema.index({ requestedDate: 1 });
appointmentSchema.index({ status: 1, requestedDate: 1 });
appointmentSchema.index({ createdAt: -1 });

// ─── Compound index: prevent duplicate pending/approved appointment
// for the same user on the same property in the same time window
appointmentSchema.index(
  { user: 1, property: 1, requestedDate: 1, status: 1 },
  {
    unique: false, // not unique — we'll handle this in business logic
    name: 'user_property_date_status_idx',
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
appointmentSchema.virtual('isUpcoming').get(function () {
  return (
    this.requestedDate > new Date() &&
    ['pending', 'approved'].includes(this.status)
  );
});

appointmentSchema.virtual('isPast').get(function () {
  return this.requestedDate < new Date();
});

// ─── Pre-save Hook: Auto-set timestamps on status transitions ─────────────────
appointmentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = now;
      // If no confirmed date set, use requested date
      if (!this.confirmedDate) this.confirmedDate = this.requestedDate;
    }
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = now;
    }
    if (this.status === 'cancelled' && !this.cancelledAt) {
      this.cancelledAt = now;
    }
  }
  next();
});

// ─── Static Method: Get upcoming appointments for a user ──────────────────────
appointmentSchema.statics.findUpcomingForUser = function (userId) {
  return this.find({
    user: userId,
    requestedDate: { $gte: new Date() },
    status: { $in: ['pending', 'approved'] },
  })
    .sort({ requestedDate: 1 })
    .populate('agent', 'firstName lastName email phone')
    .populate('property', 'title location.city location.district images');
};

// ─── Static Method: Get upcoming appointments for an agent ────────────────────
appointmentSchema.statics.findUpcomingForAgent = function (agentId) {
  return this.find({
    agent: agentId,
    requestedDate: { $gte: new Date() },
    status: { $in: ['pending', 'approved'] },
  })
    .sort({ requestedDate: 1 })
    .populate('user', 'firstName lastName email phone')
    .populate('property', 'title location.city location.district');
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
