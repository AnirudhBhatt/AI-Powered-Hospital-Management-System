const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/rooms
router.get('/', protect, async (req, res) => {
  try {
    const { ward, isOccupied } = req.query;
    const filter = {};
    if (ward) filter.ward = ward;
    if (isOccupied !== undefined) filter.isOccupied = isOccupied === 'true';
    const rooms = await Room.find(filter).populate('patientId', 'name patientId').populate('assignedDoctor', 'name');
    res.json({ success: true, data: rooms });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/rooms — Admin creates rooms
router.post('/', protect, authorize('super_admin', 'hospital_admin'), auditLog('CREATE', 'Room'), async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/rooms/:id/admit — Admit patient to room
router.patch('/:id/admit', protect, authorize('hospital_admin', 'super_admin', 'receptionist', 'nurse'), auditLog('UPDATE', 'Room'), async (req, res) => {
  try {
    const { patientId, assignedDoctor, expectedDischargeAt, notes } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.isOccupied) return res.status(400).json({ success: false, message: 'Room is already occupied' });
    room.isOccupied = true; room.patientId = patientId; room.admittedAt = new Date();
    room.assignedDoctor = assignedDoctor; room.expectedDischargeAt = expectedDischargeAt; room.notes = notes;
    await room.save();
    await Patient.findByIdAndUpdate(patientId, { isAdmitted: true, roomId: room._id });
    const patient = await Patient.findById(patientId);
    if (patient?.userId) {
      await Notification.create({ userId: patient.userId, title: 'Room Assigned', message: `You have been assigned Room ${room.roomNumber} in ${room.ward} ward`, type: 'general', priority: 'medium' });
    }
    res.json({ success: true, data: room });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/rooms/:id/discharge
router.patch('/:id/discharge', protect, authorize('hospital_admin', 'super_admin', 'nurse', 'doctor'), auditLog('UPDATE', 'Room'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    const patientId = room.patientId;
    room.isOccupied = false; room.patientId = null; room.admittedAt = null;
    room.expectedDischargeAt = null; room.assignedDoctor = null; room.notes = '';
    await room.save();
    if (patientId) {
      await Patient.findByIdAndUpdate(patientId, { isAdmitted: false, roomId: null });
      const patient = await Patient.findById(patientId);
      if (patient?.userId) {
        await Notification.create({ userId: patient.userId, title: 'Discharged', message: 'You have been successfully discharged from the hospital', type: 'general', priority: 'medium' });
      }
    }
    res.json({ success: true, data: room });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
