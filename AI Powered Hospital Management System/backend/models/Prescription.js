const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  diagnosis: { type: String, required: true },
  symptoms: { type: String, default: '' },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: '' }
  }],
  labTests: [{ type: String }],
  treatmentPlan: { type: String, default: '' },
  followUpDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Dispensed', 'Expired'], default: 'Active' },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dispensedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
