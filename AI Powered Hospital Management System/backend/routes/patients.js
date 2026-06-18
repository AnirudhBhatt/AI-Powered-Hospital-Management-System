const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect, authorize, auditLog } = require('../middleware/auth');

const allStaff = ['super_admin', 'hospital_admin', 'doctor', 'nurse', 'receptionist', 'billing_executive'];

// @route GET /api/v1/patients
router.get('/', protect, authorize(...allStaff, 'patient'), async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
      return res.json({ success: true, data: [patient] });
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const patients = await Patient.find(filter).populate('userId', 'email isActive').limit(limit * 1).skip((page - 1) * limit).sort('-createdAt');
    const total = await Patient.countDocuments(filter);
    res.json({ success: true, data: patients, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/patients/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userId', 'email isActive lastLogin').populate('roomId');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (req.user.role === 'patient' && patient.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: patient });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/patients — receptionist/admin registers walk-in patient
router.post('/', protect, authorize('receptionist', 'hospital_admin', 'super_admin'), auditLog('CREATE', 'Patient'), async (req, res) => {
  try {
    const patientId = `PAT-${Date.now()}`;
    const patient = await Patient.create({ ...req.body, patientId });
    res.status(201).json({ success: true, data: patient });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PUT /api/v1/patients/:id
router.put('/:id', protect, authorize('doctor', 'nurse', 'receptionist', 'hospital_admin', 'super_admin'), auditLog('UPDATE', 'Patient'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/patients/:id/medical-history
router.patch('/:id/medical-history', protect, authorize('doctor', 'nurse', 'hospital_admin', 'super_admin'), auditLog('UPDATE', 'Patient'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { $push: { medicalHistory: req.body } }, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/patients/me/profile
router.get('/me/profile', protect, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id }).populate('roomId');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
    res.json({ success: true, data: patient });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
