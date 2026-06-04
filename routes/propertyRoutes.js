'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllProperties,
  getPropertyById,
  getMyListings,
  createProperty,
  updateProperty,
  updatePropertyStatus,
  deleteProperty,
} = require('../controllers/propertyController');
const { verifyToken, isAgent, isAdmin } = require('../middleware/authMiddleware');

// Public
router.get('/', getAllProperties);
router.get('/my/listings', verifyToken, isAgent, getMyListings);

// Public detail, but owners/agents can still edit
router.get('/:id', getPropertyById);

// Write require auth + agent/admin role enforcement in controller to avoid duplicate auth here

// Protected mutations can be handled in controller using token directly
router.post('/', createProperty);
router.patch('/:id', updateProperty);
router.patch('/:id/status', updatePropertyStatus);
router.delete('/:id', deleteProperty);

module.exports = router;
