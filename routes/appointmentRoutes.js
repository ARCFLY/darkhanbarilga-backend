'use strict';

const express = require('express');
const router = express.Router();

const {
  createAppointment,
  getMyAppointments,
  getAgentSchedule,
  approveAppointment,
  cancelAppointment,
  completeAppointment,
} = require('../controllers/appointmentController');
const { verifyToken, isAgent, isAdmin } = require('../middleware/authMiddleware');

router.post('/', createAppointment);
router.get('/my-appointments', verifyToken, getMyAppointments);
router.get('/agent-schedule', verifyToken, isAgent, getAgentSchedule);
router.patch('/:id/approve', verifyToken, isAgent, approveAppointment);
router.patch('/:id/cancel', verifyToken, cancelAppointment);
router.patch('/:id/complete', verifyToken, isAgent, completeAppointment);

module.exports = router;
