const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  department: { type: String, required: true },
  qualifications: [{ type: String }],
  experience: { type: Number, default: 0 },
  consultationFee: { type: Number, default: 500 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  schedule: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    startTime: String,
    endTime: String,
    isAvailable: { type: Boolean, default: true }
  }],
  availableSlots: [{
    date: Date,
    slots: [{ time: String, isBooked: { type: Boolean, default: false } }]
  }],
  phone: { type: String },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
