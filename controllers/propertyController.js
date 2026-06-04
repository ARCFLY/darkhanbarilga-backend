'use strict';

const Property = require('../models/Property');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../utils/tokenUtils');

// ─── GET /api/properties ─────────────────────────────────────────────────────
const getAllProperties = catchAsync(async (req, res) => {
  const {
    search,
    district,
    city,
    minPrice,
    maxPrice,
    listingType,
    propertyType,
    minRooms,
    sort = 'newest',
    page = '1',
    limit = '20',
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
      { 'location.city': { $regex: escaped, $options: 'i' } },
      { 'location.district': { $regex: escaped, $options: 'i' } },
    ];
  }

  if (district) filter['location.district'] = { $regex: district, $options: 'i' };
  if (city) filter['location.city'] = { $regex: city, $options: 'i' };

  if (minPrice != null) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice != null) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  if (listingType) filter.listingType = listingType;
  if (propertyType) filter.propertyType = propertyType;
  if (minRooms != null) filter.rooms = { $gte: Number(minRooms) };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };
  const sortStage = sortMap[sort] || sortMap.newest;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .sort(sortStage)
      .skip(skip)
      .limit(limitNum)
      .populate('assignedAgent', 'firstName lastName email phone avatar agentProfile')
      .lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: total,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    },
    properties,
  });
});

// ─── GET /api/properties/:id ─────────────────────────────────────────────────
const getPropertyById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const property = await Property.findById(id).populate(
    'assignedAgent',
    'firstName lastName email phone avatar agentProfile'
  );

  if (!property) return next(new AppError('Property not found', 404));

  res.status(200).json({
    status: 'success',
    property,
  });
});

// ─── GET /api/properties/my/listings ─────────────────────────────────────────
const getMyListings = catchAsync(async (req, res, next) => {
  const decoded = verifyAccessToken(req.headers.authorization?.split(' ')[1]);
  if (decoded.role !== 'agent' && decoded.role !== 'admin') {
    return next(new AppError('Only agents and admins can access listings', 403));
  }

  const filter = decoded.role === 'admin' ? {} : { assignedAgent: decoded.id };

  const properties = await Property.find(filter)
    .sort({ createdAt: -1 })
    .populate('assignedAgent', 'firstName lastName email phone avatar agentProfile')
    .lean();

  res.status(200).json({
    status: 'success',
    results: properties.length,
    properties,
  });
});

// ─── Authorization helper: owner agent/admin ─────────────────────────────────
const authorizePropertyMutation = async (propertyId, userId, role) => {
  const property = await Property.findById(propertyId);
  if (!property) throw new AppError('Property not found', 404);
  if (role !== 'admin' && String(property.assignedAgent) !== String(userId)) {
    throw new AppError('You are not authorized to modify this property', 403);
  }
  return property;
};

// ─── POST /api/properties ─────────────────────────────────────────────────────
const createProperty = catchAsync(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Authorization token required', 401));
  }

  const decoded = verifyAccessToken(authorization.split(' ')[1]);
  if (decoded.role !== 'agent' && decoded.role !== 'admin') {
    return next(new AppError('Only agents and admins can create properties', 403));
  }

  // For agents, verify approval
  if (decoded.role === 'agent') {
    const agent = await User.findById(decoded.id).select('agentProfile');
    if (!agent || agent.agentProfile?.approvalStatus !== 'approved') {
      return next(new AppError('Your agent account is not approved yet', 403));
    }
  }

  const allowedFields = [
    'title',
    'description',
    'propertyType',
    'listingType',
    'price',
    'currency',
    'priceNegotiable',
    'rooms',
    'bedrooms',
    'bathrooms',
    'floorNumber',
    'totalFloors',
    'sizeSqm',
    'yearBuilt',
    'features',
    'images',
    'location',
    'status',
    'isFeatured',
    'publishedAt',
  ];

  const input = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) input[key] = req.body[key];
  }

  input.assignedAgent = decoded.id;
  input.createdBy = decoded.id;

  const property = await Property.create(input);
  await property.populate('assignedAgent', 'firstName lastName email phone avatar agentProfile');

  res.status(201).json({
    status: 'success',
    property,
  });
});

// ─── PATCH /api/properties/:id ────────────────────────────────────────────────
const updateProperty = catchAsync(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Authorization token required', 401));
  }

  const decoded = verifyAccessToken(authorization.split(' ')[1]);
  const property = await authorizePropertyMutation(req.params.id, decoded.id, decoded.role);

  const allowedFields = [
    'title',
    'description',
    'propertyType',
    'listingType',
    'price',
    'currency',
    'priceNegotiable',
    'rooms',
    'bedrooms',
    'bathrooms',
    'floorNumber',
    'totalFloors',
    'sizeSqm',
    'yearBuilt',
    'features',
    'images',
    'location',
    'status',
    'isFeatured',
    'assignedAgent',
  ];

  for (const key of Object.keys(req.body)) {
    if (allowedFields.includes(key)) property[key] = req.body[key];
  }

  await property.save();
  await property.populate('assignedAgent', 'firstName lastName email phone avatar agentProfile');

  res.status(200).json({
    status: 'success',
    property,
  });
});

// ─── PATCH /api/properties/:id/status ────────────────────────────────────────
const updatePropertyStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!status || !['available', 'rented', 'sold', 'pending', 'archived'].includes(status)) {
    return next(new AppError('Valid status is required', 400));
  }

  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Authorization token required', 401));
  }

  const decoded = verifyAccessToken(authorization.split(' ')[1]);
  const property = await authorizePropertyMutation(req.params.id, decoded.id, decoded.role);

  property.status = status;
  await property.save();
  await property.populate('assignedAgent', 'firstName lastName email phone avatar agentProfile');

  res.status(200).json({
    status: 'success',
    property,
  });
});

// ─── DELETE /api/properties/:id ───────────────────────────────────────────────
const deleteProperty = catchAsync(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Authorization token required', 401));
  }

  const decoded = verifyAccessToken(authorization.split(' ')[1]);
  await authorizePropertyMutation(req.params.id, decoded.id, decoded.role);

  await Property.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getAllProperties,
  getPropertyById,
  getMyListings,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
};
