const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  testId: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  testType: {
    type: String,
    enum: ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'ECG', 'Ultrasound', 'Biopsy', 'Culture Test', 'Other'],
    required: true
  },
  testName: { type: String, required: true },
  priority: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
  status: {
    type: String,
    enum: ['Ordered', 'Sample Collected', 'Testing', 'Report Generated', 'Reviewed'],
    default: 'Ordered'
  },
  sampleCollectedAt: { type: Date, default: null },
  testStartedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  result: { type: String, default: '' },
  reportUrl: { type: String, default: null },
  reportData: { type: String, default: null }, // base64
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: String, default: '' },
  cost: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LabTest', labTestSchema);
