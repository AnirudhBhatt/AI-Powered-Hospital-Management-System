const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/medicines
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { genericName: { $regex: search, $options: 'i' } }];
    const medicines = await Medicine.find(filter).sort('name');
    const data = lowStock === 'true' ? medicines.filter(m => m.stock <= m.minStock) : medicines;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/medicines
router.post('/', protect, authorize('pharmacist', 'hospital_admin', 'super_admin'), auditLog('CREATE', 'Medicine'), async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json({ success: true, data: medicine });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PUT /api/v1/medicines/:id
router.put('/:id', protect, authorize('pharmacist', 'hospital_admin', 'super_admin'), auditLog('UPDATE', 'Medicine'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/medicines/:id/stock — Update stock (dispense or restock)
router.patch('/:id/stock', protect, authorize('pharmacist', 'hospital_admin'), auditLog('UPDATE', 'Medicine'), async (req, res) => {
  try {
    const { quantity, action } = req.body; // action: 'add' | 'subtract'
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (action === 'subtract') {
      if (medicine.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
      medicine.stock -= quantity;
    } else {
      medicine.stock += quantity;
    }
    await medicine.save();
    if (medicine.stock <= medicine.minStock) {
      const admins = await User.find({ role: { $in: ['hospital_admin', 'super_admin'] } });
      for (const admin of admins) {
        await Notification.create({ userId: admin._id, title: 'Low Stock Alert', message: `${medicine.name} stock is low (${medicine.stock} remaining)`, type: 'inventory', priority: 'high' });
      }
    }
    res.json({ success: true, data: medicine });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route DELETE /api/v1/medicines/:id
router.delete('/:id', protect, authorize('pharmacist', 'hospital_admin', 'super_admin'), auditLog('DELETE', 'Medicine'), async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
