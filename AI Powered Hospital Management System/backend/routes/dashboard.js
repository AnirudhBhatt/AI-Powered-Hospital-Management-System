const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');
const Room = require('../models/Room');
const LabTest = require('../models/LabTest');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const MedicalRecord = require('../models/MedicalRecord');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/v1/dashboard/stats — General stats for admin dashboards
router.get('/stats', protect, authorize('super_admin', 'hospital_admin'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalPatients, todayAppointments, monthRevenue, totalDoctors, occupiedRooms, totalRooms, pendingLabTests, lowStockMedicines, recentAppointments] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } }),
      Invoice.aggregate([{ $match: { status: 'Paid', paidAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Doctor.countDocuments(),
      Room.countDocuments({ isOccupied: true }),
      Room.countDocuments(),
      LabTest.countDocuments({ status: { $nin: ['Report Generated', 'Reviewed'] } }),
      Medicine.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] } }),
      Appointment.find().populate('patientId', 'name').populate('doctorId', 'name').sort('-createdAt').limit(5)
    ]);

    // Monthly revenue trend (last 6 months)
    const revenueTrend = await Invoice.aggregate([
      { $match: { status: 'Paid', paidAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) } } },
      { $group: { _id: { month: { $month: '$paidAt' }, year: { $year: '$paidAt' } }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Appointments by department
    const deptStats = await Appointment.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 6 }
    ]);

    // Daily patients (last 7 days)
    const patientTrend = await Appointment.aggregate([
      { $match: { date: { $gte: new Date(today.getTime() - 6 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalPatients,
          todayAppointments,
          monthRevenue: monthRevenue[0]?.total || 0,
          totalDoctors,
          bedOccupancy: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
          occupiedRooms,
          totalRooms,
          pendingLabTests,
          lowStockMedicines
        },
        revenueTrend,
        deptStats,
        patientTrend,
        recentAppointments
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/doctor — Doctor dashboard stats
router.get('/doctor', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    const today = new Date(); today.setHours(0,0,0,0);
    const [todayAppointments, totalPatients, pendingTests] = await Promise.all([
      Appointment.find({ doctorId: doctor._id, date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } }).populate('patientId', 'name patientId phone'),
      Appointment.distinct('patientId', { doctorId: doctor._id }),
      LabTest.countDocuments({ doctorId: doctor._id, status: { $nin: ['Reviewed'] } })
    ]);
    res.json({ success: true, data: { doctor, todayAppointments, totalUniquePatients: totalPatients.length, pendingTests } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/nurse — Nurse dashboard stats
router.get('/nurse', protect, authorize('nurse'), async (req, res) => {
  try {
    const patients = await Patient.find({ isAdmitted: true });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const rooms = await Room.find({ isOccupied: true });
    const notifications = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, data: {
      admittedPatients: patients.length,
      occupiedRooms: rooms.length,
      unreadNotifications: notifications,
      recentPatients: patients.slice(0, 5)
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/receptionist — Receptionist dashboard stats
router.get('/receptionist', protect, authorize('receptionist'), async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const todayAppointments = await Appointment.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } });
    const requested = await Appointment.countDocuments({ status: 'Requested' });
    const totalPatients = await Patient.countDocuments();
    const availableDoctors = await Doctor.countDocuments({ isAvailable: true });
    const recentAppointments = await Appointment.find({ date: { $gte: todayStart, $lte: todayEnd } })
      .populate('patientId', 'name patientId').populate('doctorId', 'name specialization')
      .sort('-createdAt').limit(10);
    res.json({ success: true, data: {
      todayAppointments, pendingRequests: requested, totalPatients, availableDoctors, recentAppointments
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/lab — Lab technician dashboard stats
router.get('/lab', protect, authorize('lab_technician'), async (req, res) => {
  try {
    const pending = await LabTest.countDocuments({ status: { $in: ['Ordered', 'Sample Collected'] } });
    const testing = await LabTest.countDocuments({ status: 'Testing' });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const completedToday = await LabTest.countDocuments({ status: 'Report Generated', completedAt: { $gte: todayStart } });
    const urgent = await LabTest.countDocuments({ priority: 'Urgent', status: { $ne: 'Report Generated' } });
    const recentTests = await LabTest.find().populate('patientId', 'name patientId')
      .populate('doctorId', 'name').sort('-createdAt').limit(10);
    res.json({ success: true, data: {
      pendingTests: pending, inTesting: testing, completedToday, urgentTests: urgent, recentTests
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/pharmacist — Pharmacist dashboard stats
router.get('/pharmacist', protect, authorize('pharmacist'), async (req, res) => {
  try {
    const activePrescriptions = await Prescription.countDocuments({ status: 'Active' });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const dispensedToday = await Prescription.countDocuments({ status: 'Dispensed', dispensedAt: { $gte: todayStart } });
    const medicines = await Medicine.find();
    const lowStock = medicines.filter(m => m.stock <= m.minStock).length;
    const expired = medicines.filter(m => new Date(m.expiryDate) < new Date()).length;
    const totalMedicines = medicines.length;
    res.json({ success: true, data: {
      activePrescriptions, dispensedToday, lowStockMedicines: lowStock, expiredMedicines: expired, totalMedicines
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/billing — Billing executive dashboard stats
router.get('/billing', protect, authorize('billing_executive'), async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const pendingInvoices = await Invoice.countDocuments({ status: 'Pending' });
    const paidToday = await Invoice.find({ status: 'Paid', paidAt: { $gte: todayStart } });
    const todayRevenue = paidToday.reduce((sum, inv) => sum + (inv.paidAmount || inv.totalAmount), 0);
    const totalPending = await Invoice.find({ status: 'Pending' });
    const totalPendingAmount = totalPending.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const insuranceClaims = await Invoice.countDocuments({ 'insurance.claimStatus': 'Pending' });
    const recentInvoices = await Invoice.find().populate('patientId', 'name patientId')
      .sort('-createdAt').limit(10);
    res.json({ success: true, data: {
      todayRevenue, pendingInvoices, totalPendingAmount, insuranceClaims, recentInvoices
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/dashboard/patient — Patient dashboard stats
router.get('/patient', protect, authorize('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
    const upcomingAppointments = await Appointment.find({ 
      patientId: patient._id, status: { $in: ['Requested', 'Confirmed'] } 
    }).populate('doctorId', 'name specialization department').sort('date').limit(5);
    const activePrescriptions = await Prescription.countDocuments({ patientId: patient._id, status: 'Active' });
    const pendingBills = await Invoice.find({ patientId: patient._id, status: { $in: ['Pending', 'Partial'] } });
    const pendingAmount = pendingBills.reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0);
    const unreadNotifications = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    const recentRecords = await MedicalRecord.find({ patientId: patient._id }).sort('-createdAt').limit(5);
    res.json({ success: true, data: {
      upcomingAppointments, activePrescriptions, pendingBills: pendingBills.length,
      pendingAmount, unreadNotifications, recentRecords
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
