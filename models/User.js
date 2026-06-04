'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Sub-schema: Agent-specific profile ──────────────────────────────────────
const agentProfileSchema = new mongoose.Schema(
  {
    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },
    agency: {
      type: String,
      trim: true,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: null,
    },
    specializations: {
      type: [String],
      default: [],
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'suspended'],
        message: '"{VALUE}" is not a valid agent approval status',
      },
      default: 'pending',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false } // no separate _id for sub-document
);

// ─── Main User Schema ─────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^\+?[1-9]\d{6,14}$/,
        'Please enter a valid phone number (E.164 format recommended)',
      ],
      default: null,
    },
    avatar: {
      type: String, // URL to profile picture
      default: null,
    },

    // ── Authorization ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ['user', 'agent', 'admin'],
        message: '"{VALUE}" is not a valid role',
      },
      default: 'user',
    },

    // ── Agent Profile (only populated when role === 'agent') ──────────────────
    agentProfile: {
      type: agentProfileSchema,
      default: null,
    },

    // ── Security ──────────────────────────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ 'agentProfile.approvalStatus': 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Pre-save Hook: Hash password before saving ───────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field has been modified
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Pre-save Hook: Ensure agentProfile exists when role is 'agent' ───────────
userSchema.pre('save', function (next) {
  if (this.role === 'agent' && !this.agentProfile) {
    this.agentProfile = {}; // initialise with defaults from sub-schema
  }
  next();
});

// ─── Instance Method: Compare plain-text password with stored hash ─────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Safe public representation (no sensitive fields) ─────────
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

// ─── Static Method: Find active users by role ─────────────────────────────────
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
