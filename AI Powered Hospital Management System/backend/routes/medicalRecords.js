const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const { protect, authorize, auditLog } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'medical-records');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /pdf|jpg|jpeg|png|dicom|dcm/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
  cb(null, ext || mime);
}});

// @route GET /api/v1/medical-records
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.type) filter.type = req.query.type;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) filter.patientId = patient._id;
    }
    const records = await MedicalRecord.find(filter)
      .populate('patientId', 'name patientId')
      .populate('uploadedBy', 'name role')
      .populate('doctorId', 'name')
      .limit(limit * 1).skip((page - 1) * limit).sort('-createdAt');
    const total = await MedicalRecord.countDocuments(filter);
    res.json({ success: true, data: records, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/medical-records
router.post('/', protect, authorize('doctor', 'lab_technician', 'hospital_admin', 'nurse'), upload.single('file'), auditLog('CREATE', 'MedicalRecord'), async (req, res) => {
  try {
    if (req.body.patient && !req.body.patientId) req.body.patientId = req.body.patient;
    const data = { ...req.body, uploadedBy: req.user._id };
    if (req.file) {
      data.fileUrl = `/uploads/medical-records/${req.file.filename}`;
    }
    const record = await MedicalRecord.create(data);
    res.status(201).json({ success: true, data: record });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/medical-records/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId').populate('uploadedBy', 'name role').populate('doctorId');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/medical-records/:id/download
router.get('/:id/download', protect, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (!record.fileUrl) return res.status(404).json({ success: false, message: 'No file attached to this record' });
    const filePath = path.join(__dirname, '..', record.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });
    res.download(filePath);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route DELETE /api/v1/medical-records/:id
router.delete('/:id', protect, authorize('doctor', 'hospital_admin', 'super_admin'), auditLog('DELETE', 'MedicalRecord'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (record && record.fileUrl) {
      const filePath = path.join(__dirname, '..', record.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
