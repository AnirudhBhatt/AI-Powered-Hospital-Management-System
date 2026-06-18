const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, unique: true, required: true },
  ward: { type: String, enum: ['General', 'ICU', 'Emergency', 'Maternity', 'Pediatric', 'Surgical', 'Orthopedic', 'Private'], required: true },
  type: { type: String, enum: ['Single', 'Double', 'Suite', 'ICU Bed', 'Emergency Bed'], required: true },
  floor: { type: Number, default: 1 },
  dailyRate: { type: Number, required: true },
  isOccupied: { type: Boolean, default: false },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  admittedAt: { type: Date, default: null },
  expectedDischargeAt: { type: Date, default: null },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: String, default: '' },
  features: [{ type: String }] // AC, TV, Attached Bathroom etc.
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
