const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], default: null },
  phone: { type: String, required: true },
  email: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    validUntil: Date
  },
  medicalHistory: {
    allergies: [{ type: String }],
    previousDiseases: [{ type: String }],
    surgeries: [{ description: String, date: Date }],
    currentMedications: [{ name: String, dosage: String }]
  },
  isAdmitted: { type: Boolean, default: false },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
