const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, unique: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  items: [{
    description: { type: String, required: true },
    type: { type: String, enum: ['Consultation', 'Lab Test', 'Medicine', 'Admission', 'Procedure', 'Other'], required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Partial', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'Cash', 'Insurance', 'Online'], default: null },
  paidAt: { type: Date, default: null },
  paidAmount: { type: Number, default: 0 },
  insurance: {
    provider: String,
    claimId: String,
    claimStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'N/A'], default: 'N/A' },
    coveredAmount: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
