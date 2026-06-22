const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/v1/doctors
router.get('/', protect, async (req, res) => {
  try {
    const { department, specialization, isAvailable, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (specialization) filter.specialization = { $regex: specialization, $options: 'i' };
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { specialization: { $regex: search, $options: 'i' } }];
    const doctors = await Doctor.find(filter).populate('userId', 'email isActive');
    res.json({ success: true, data: doctors });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/doctors/me/profile
router.get('/me/profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    res.json({ success: true, data: doctor });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/doctors/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'email phone');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/doctors — Admin creates doctor profile
router.post('/', protect, authorize('super_admin', 'hospital_admin'), async (req, res) => {
  try {
    const { userId, specialization, department, qualifications, experience, consultationFee, schedule, phone } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') return res.status(400).json({ success: false, message: 'Valid doctor user required' });
    const doctorId = `DOC-${Date.now()}`;
    const doctor = await Doctor.create({ userId, doctorId, name: user.name, specialization, department, qualifications, experience, consultationFee, schedule, phone });
    res.status(201).json({ success: true, data: doctor });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PUT /api/v1/doctors/:id
router.put('/:id', protect, authorize('super_admin', 'hospital_admin', 'doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});



// @route PUT /api/v1/doctors/:id/schedule
router.put('/:id/schedule', protect, authorize('doctor', 'hospital_admin', 'super_admin'), async (req, res) => {
  try {
    const { schedule } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { schedule }, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/doctors/:id/slots
router.get('/:id/slots', protect, async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    
    // Find the day of week for the requested date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = doctor.schedule?.find(s => s.day === dayOfWeek && s.isAvailable);
    
    if (!daySchedule) return res.json({ success: true, data: { available: false, slots: [] } });
    
    // Generate time slots from schedule
    const slots = [];
    const start = parseInt(daySchedule.startTime?.split(':')[0] || '9');
    const end = parseInt(daySchedule.endTime?.split(':')[0] || '17');
    for (let h = start; h < end; h++) {
      slots.push({ time: `${String(h).padStart(2,'0')}:00`, isBooked: false });
      slots.push({ time: `${String(h).padStart(2,'0')}:30`, isBooked: false });
    }
    
    // Check existing appointments for that date
    const dateStart = new Date(date); dateStart.setHours(0,0,0,0);
    const dateEnd = new Date(date); dateEnd.setHours(23,59,59,999);
    const existingAppts = await Appointment.find({
      doctorId: doctor._id, date: { $gte: dateStart, $lte: dateEnd },
      status: { $nin: ['Cancelled'] }
    });
    existingAppts.forEach(appt => {
      const slot = slots.find(s => s.time === appt.timeSlot);
      if (slot) slot.isBooked = true;
    });
    
    res.json({ success: true, data: { available: true, doctor: { name: doctor.name, specialization: doctor.specialization }, slots } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
