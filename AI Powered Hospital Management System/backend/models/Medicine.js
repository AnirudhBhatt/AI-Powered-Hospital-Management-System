const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'],
    required: true
  },
  manufacturer: { type: String, default: '' },
  supplier: { type: String, default: '' },
  stock: { type: Number, required: true, default: 0 },
  minStock: { type: Number, default: 50 },
  unit: { type: String, default: 'units' },
  price: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  batchNumber: { type: String, default: '' },
  location: { type: String, default: '' }, // shelf/rack location
  isAvailable: { type: Boolean, default: true },
  description: { type: String, default: '' }
}, { timestamps: true });

// Virtual to check if low stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStock;
});

// Virtual to check if expired
medicineSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

medicineSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);
