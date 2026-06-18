const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/appointments
router.get('/', protect, async (req, res) => {
  try {
    const { status, date, doctorId, patientId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (date) { const d = new Date(date); filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) filter.patientId = patient._id;
    }
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) filter.doctorId = doctor._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name patientId phone')
      .populate('doctorId', 'name specialization department')
      .limit(limit * 1).skip((page - 1) * limit).sort('-createdAt');
    const total = await Appointment.countDocuments(filter);
    res.json({ success: true, data: appointments, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/appointments
router.post('/', protect, auditLog('CREATE', 'Appointment'), async (req, res) => {
  try {
    const { patientId, doctorId, department, date, timeSlot, symptoms } = req.body;
    const appointmentId = `APT-${Date.now()}`;
    const appointment = await Appointment.create({
      appointmentId, patientId, doctorId, department, date, timeSlot, symptoms,
      createdBy: req.user._id, status: 'Requested'
    });
    await appointment.populate('patientId', 'name'); 
    await appointment.populate('doctorId', 'name userId');

    // Notify doctor
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      await Notification.create({ userId: doctor.userId, title: 'New Appointment Request', message: `New appointment scheduled for ${new Date(date).toLocaleDateString()} at ${timeSlot}`, type: 'appointment', priority: 'medium' });
    }
    res.status(201).json({ success: true, data: appointment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/appointments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId').populate('doctorId').populate('createdBy', 'name email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/appointments/:id/status
router.patch('/:id/status', protect, auditLog('UPDATE', 'Appointment'), async (req, res) => {
  try {
    const { status, notes, diagnosis, cancelReason } = req.body;
    const validStatuses = ['Requested', 'Confirmed', 'In Consultation', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const update = { status };
    if (notes) update.notes = notes;
    if (diagnosis) update.diagnosis = diagnosis;
    if (cancelReason) { update.cancelReason = cancelReason; update.cancelledBy = req.user._id; }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('patientId', 'name userId').populate('doctorId', 'name');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Notify patient
    if (appointment.patientId?.userId) {
      await Notification.create({
        userId: appointment.patientId.userId,
        title: 'Appointment Update',
        message: `Your appointment with Dr. ${appointment.doctorId?.name} is now ${status}`,
        type: 'appointment',
        priority: status === 'Cancelled' ? 'high' : 'medium'
      });
    }
    res.json({ success: true, data: appointment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route DELETE /api/v1/appointments/:id
router.delete('/:id', protect, authorize('super_admin', 'hospital_admin', 'receptionist'), auditLog('DELETE', 'Appointment'), async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
