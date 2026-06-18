const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { protect, authorize, auditLog } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'lab-reports');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /pdf|jpg|jpeg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
  cb(null, ext || mime);
}});

// @route GET /api/v1/lab-tests
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) filter.patientId = patient._id;
    }
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) filter.doctorId = doctor._id;
    }
    const tests = await LabTest.find(filter)
      .populate('patientId', 'name patientId').populate('doctorId', 'name')
      .limit(limit * 1).skip((page - 1) * limit).sort('-createdAt');
    const total = await LabTest.countDocuments(filter);
    res.json({ success: true, data: tests, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/lab-tests — Doctor orders test
router.post('/', protect, authorize('doctor'), auditLog('CREATE', 'LabTest'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const testId = `LAB-${Date.now()}`;
    const test = await LabTest.create({ ...req.body, doctorId: doctor._id, testId });
    res.status(201).json({ success: true, data: test });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/lab-tests/:id/status — Lab tech updates
router.patch('/:id/status', protect, authorize('lab_technician', 'doctor', 'hospital_admin'), auditLog('UPDATE', 'LabTest'), async (req, res) => {
  try {
    const { status, result, reportData } = req.body;
    const update = { status, processedBy: req.user._id };
    if (result) update.result = result;
    if (reportData) update.reportData = reportData;
    if (status === 'Sample Collected') update.sampleCollectedAt = new Date();
    if (status === 'Testing') update.testStartedAt = new Date();
    if (status === 'Report Generated') { update.completedAt = new Date(); }
    if (status === 'Reviewed') update.reviewedAt = new Date();

    const test = await LabTest.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('patientId', 'name userId').populate('doctorId', 'name userId');

    if (status === 'Report Generated') {
      if (test.patientId?.userId) {
        await Notification.create({ userId: test.patientId.userId, title: 'Lab Report Ready', message: `Your ${test.testName} report is ready`, type: 'lab_report', priority: 'medium' });
      }
      if (test.doctorId?.userId) {
        await Notification.create({ userId: test.doctorId.userId, title: 'Lab Report Available', message: `${test.testName} report for patient is ready for review`, type: 'lab_report', priority: 'medium' });
      }
    }
    res.json({ success: true, data: test });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/lab-tests/:id/upload-report — Lab tech uploads report file
router.patch('/:id/upload-report', protect, authorize('lab_technician', 'doctor', 'hospital_admin'), upload.single('report'), auditLog('UPDATE', 'LabTest'), async (req, res) => {
  try {
    const test = await LabTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Lab test not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No report file uploaded' });
    test.reportUrl = `/uploads/lab-reports/${req.file.filename}`;
    await test.save();
    res.json({ success: true, data: test });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
