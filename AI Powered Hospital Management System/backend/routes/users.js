const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/users — Admin only
router.get('/', protect, authorize('super_admin', 'hospital_admin'), async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const users = await User.find(filter).limit(limit * 1).skip((page - 1) * limit).sort('-createdAt');
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/users — Hospital Admin creates staff
router.post('/', protect, authorize('super_admin', 'hospital_admin'), auditLog('CREATE', 'User'), async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'billing_executive', 'hospital_admin'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role for staff creation' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password, role, department, phone });
    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/users/:id
router.get('/:id', protect, authorize('super_admin', 'hospital_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toJSON() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PUT /api/v1/users/:id
router.put('/:id', protect, authorize('super_admin', 'hospital_admin'), auditLog('UPDATE', 'User'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toJSON() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/users/:id/toggle
router.patch('/:id/toggle', protect, authorize('super_admin', 'hospital_admin'), auditLog('UPDATE', 'User'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user.toJSON(), message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
