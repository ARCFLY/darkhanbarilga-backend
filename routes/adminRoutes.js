'use strict';

const express = require('express');
const router = express.Router();

const {
  getStats,
  getUsers,
  approveAgent,
  rejectAgent,
  deactivateUser,
} = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/agents/:id/approve', approveAgent);
router.patch('/agents/:id/reject', rejectAgent);
router.patch('/users/:id/deactivate', deactivateUser);

module.exports = router;
