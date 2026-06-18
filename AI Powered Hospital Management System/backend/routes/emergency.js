const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/emergency — Get all emergency cases
router.get('/', protect, async (req, res) => {
  try {
    const emergencies = await Appointment.find({ type: 'Emergency', status: { $nin: ['Completed', 'Cancelled'] } })
      .populate('patientId', 'name patientId phone bloodGroup').populate('doctorId', 'name specialization').sort('createdAt');
    res.json({ success: true, data: emergencies });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/emergency — Register emergency case
router.post('/', protect, auditLog('CREATE', 'Emergency'), async (req, res) => {
  try {
    const { patientId, symptoms, notes } = req.body;
    const appointmentId = `EMG-${Date.now()}`;
    // Auto-assign available doctor
    let doctorId = req.body.doctorId;
    if (!doctorId) {
      const availableDoctor = await Doctor.findOne({ isAvailable: true });
      doctorId = availableDoctor?._id;
    }
    const emergency = await Appointment.create({
      appointmentId, patientId, doctorId, department: 'Emergency',
      date: new Date(), timeSlot: 'Immediate', status: 'Confirmed',
      type: 'Emergency', symptoms, notes, createdBy: req.user._id
    });

    // Alert all doctors and admin
    const doctors = await User.find({ role: 'doctor' });
    const admins = await User.find({ role: { $in: ['hospital_admin', 'super_admin'] } });
    const allToNotify = [...doctors, ...admins];
    for (const u of allToNotify) {
      await Notification.create({ userId: u._id, title: '🚨 Emergency Case', message: `Emergency case registered. Immediate attention required.`, type: 'emergency', priority: 'critical' });
    }
    res.status(201).json({ success: true, data: emergency });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
