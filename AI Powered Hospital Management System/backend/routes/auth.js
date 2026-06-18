const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

// @route POST /api/v1/auth/register (Patient only)
router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').notEmpty(),
  body('dob').isDate(),
  body('gender').isIn(['Male', 'Female', 'Other'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ ...req.body, role: 'patient' });
    const patientId = `PAT-${Date.now()}`;
    await Patient.create({
      userId: user._id,
      patientId,
      name: req.body.name,
      dob: req.body.dob,
      gender: req.body.gender,
      phone: req.body.phone,
      email: req.body.email,
      bloodGroup: req.body.bloodGroup || null,
      address: req.body.address || {},
      emergencyContact: req.body.emergencyContact || {}
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });
    await AuditLog.create({ userId: user._id, userEmail: user.email, userRole: 'patient', action: 'REGISTER', resource: 'User', status: 'success' });

    res.status(201).json({ success: true, message: 'Registration successful', data: { user: user.toJSON(), accessToken, refreshToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/v1/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({ userEmail: email, action: 'LOGIN_FAILED', resource: 'Auth', status: 'failure' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });
    await AuditLog.create({ userId: user._id, userEmail: user.email, userRole: user.role, action: 'LOGIN', resource: 'Auth', status: 'success', ip: req.ip });

    res.json({ success: true, message: 'Login successful', data: { user: user.toJSON(), accessToken, refreshToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    const tokens = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });
    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token expired' });
  }
});

// @route POST /api/v1/auth/logout
router.post('/logout', protect, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  await AuditLog.create({ userId: req.user._id, userEmail: req.user.email, userRole: req.user.role, action: 'LOGOUT', resource: 'Auth', status: 'success' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @route GET /api/v1/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @route PUT /api/v1/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PUT /api/v1/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, data: user });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
