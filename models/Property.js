'use strict';

const mongoose = require('mongoose');

// ─── Sub-schema: Location ─────────────────────────────────────────────────────
const locationSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      trim: true,
      default: 'Mongolia',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    subDistrict: {
      type: String,
      trim: true,
      default: null,
    },
    streetAddress: {
      type: String,
      trim: true,
      default: null,
    },
    zipCode: {
      type: String,
      trim: true,
      default: null,
    },
    // GeoJSON point for geospatial queries (optional, populated when coords known)
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
  },
  { _id: false }
);

// ─── Sub-schema: Property Image ───────────────────────────────────────────────
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    altText: {
      type: String,
      default: '',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ─── Main Property Schema ─────────────────────────────────────────────────────
const propertySchema = new mongoose.Schema(
  {
    // ── Core Info ─────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    propertyType: {
      type: String,
      enum: {
        values: ['apartment', 'house', 'villa', 'office', 'land', 'commercial', 'other'],
        message: '"{VALUE}" is not a valid property type',
      },
      required: [true, 'Property type is required'],
    },
    listingType: {
      type: String,
      enum: {
        values: ['sale', 'rent'],
        message: '"{VALUE}" is not a valid listing type',
      },
      required: [true, 'Listing type (sale or rent) is required'],
    },

    // ── Pricing ───────────────────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['MNT', 'USD', 'EUR'],
      default: 'MNT',
    },
    priceNegotiable: {
      type: Boolean,
      default: false,
    },

    // ── Physical Attributes ───────────────────────────────────────────────────
    rooms: {
      type: Number,
      required: [true, 'Number of rooms is required'],
      min: [0, 'Rooms cannot be negative'],
    },
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative'],
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative'],
      default: 0,
    },
    floorNumber: {
      type: Number,
      default: null,
    },
    totalFloors: {
      type: Number,
      default: null,
    },
    sizeSqm: {
      type: Number,
      required: [true, 'Property size in m² is required'],
      min: [1, 'Size must be at least 1 m²'],
    },
    yearBuilt: {
      type: Number,
      min: [1800, 'Year built seems too old'],
      max: [new Date().getFullYear() + 5, 'Year built cannot be in the far future'],
      default: null,
    },
    features: {
      // Flexible list: 'parking', 'elevator', 'balcony', etc.
      type: [String],
      default: [],
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: 'A property cannot have more than 30 images',
      },
    },

    // ── Location ──────────────────────────────────────────────────────────────
    location: {
      type: locationSchema,
      required: [true, 'Location details are required'],
    },

    // ── Status & Lifecycle ────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['available', 'rented', 'sold', 'pending', 'archived'],
        message: '"{VALUE}" is not a valid property status',
      },
      default: 'available',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: null,
    },

    // ── Ownership & Assignment ────────────────────────────────────────────────
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An assigned agent is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
propertySchema.index({ status: 1 });
propertySchema.index({ 'location.city': 1, 'location.district': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ sizeSqm: 1 });
propertySchema.index({ assignedAgent: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ isFeatured: 1, createdAt: -1 });
propertySchema.index({ createdAt: -1 });
// Geospatial index for coordinate-based searches
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Full-text search index
propertySchema.index(
  { title: 'text', description: 'text', 'location.city': 'text', 'location.district': 'text' },
  { weights: { title: 10, 'location.city': 5, 'location.district': 3, description: 1 } }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
propertySchema.virtual('primaryImage').get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary ? primary.url : this.images[0]?.url || null;
});

propertySchema.virtual('formattedPrice').get(function () {
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: this.currency,
    maximumFractionDigits: 0,
  }).format(this.price);
});

// ─── Instance Method: Increment view count ────────────────────────────────────
propertySchema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
