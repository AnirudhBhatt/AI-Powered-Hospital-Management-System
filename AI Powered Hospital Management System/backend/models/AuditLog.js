const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userEmail: { type: String, default: 'system' },
  userRole: { type: String, default: 'system' },
  action: { type: String, required: true }, // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
  resource: { type: String, required: true }, // Patient, Appointment, etc.
  resourceId: { type: String, default: null },
  details: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  status: { type: String, enum: ['success', 'failure'], default: 'success' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
