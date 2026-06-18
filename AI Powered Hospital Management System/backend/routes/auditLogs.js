const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @route GET /api/v1/audit-logs — Super Admin only
router.get('/', protect, authorize('super_admin', 'hospital_admin'), async (req, res) => {
  try {
    const { action, resource, userId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;
    const logs = await AuditLog.find(filter).sort('-createdAt').limit(limit * 1).skip((page - 1) * limit);
    const total = await AuditLog.countDocuments(filter);
    res.json({ success: true, data: logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
