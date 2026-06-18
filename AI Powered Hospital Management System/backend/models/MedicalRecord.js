const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['Prescription', 'Lab Report', 'X-Ray', 'MRI Report', 'CT Scan', 'Discharge Summary', 'Other'],
    required: true
  },
  category: { type: String, default: 'General' },
  fileUrl: { type: String, default: null },
  fileData: { type: String, default: null }, // base64 for small files
  description: { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  tags: [{ type: String }],
  isConfidential: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
