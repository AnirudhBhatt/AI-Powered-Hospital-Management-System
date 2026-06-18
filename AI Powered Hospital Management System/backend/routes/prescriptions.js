const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/prescriptions
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) filter.patientId = patient._id;
    }
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) filter.doctorId = doctor._id;
    }
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name patientId').populate('doctorId', 'name specialization').sort('-createdAt');
    res.json({ success: true, data: prescriptions });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/prescriptions
router.post('/', protect, authorize('doctor'), auditLog('CREATE', 'Prescription'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    const prescriptionId = `PRE-${Date.now()}`;
    const prescription = await Prescription.create({ ...req.body, doctorId: doctor._id, prescriptionId });

    // Notify patient
    const patient = await Patient.findById(req.body.patientId);
    if (patient) {
      await Notification.create({ userId: patient.userId, title: 'New Prescription', message: `Dr. ${doctor.name} has created a new prescription for you`, type: 'prescription', priority: 'medium' });
    }
    res.status(201).json({ success: true, data: prescription });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/prescriptions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name patientId').populate('doctorId', 'name specialization department');
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
    res.json({ success: true, data: prescription });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/prescriptions/:id/dispense — Pharmacist
router.patch('/:id/dispense', protect, authorize('pharmacist'), auditLog('UPDATE', 'Prescription'), async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: 'Dispensed', dispensedBy: req.user._id, dispensedAt: new Date() },
      { new: true }
    ).populate('patientId', 'name userId');

    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
    if (prescription.patientId?.userId) {
      await Notification.create({ userId: prescription.patientId.userId, title: 'Prescription Ready', message: 'Your prescription medicines are ready for pickup', type: 'prescription', priority: 'medium' });
    }
    res.json({ success: true, data: prescription });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
