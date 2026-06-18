const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route GET /api/v1/notifications — Get user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const { isRead, limit = 20, page = 1 } = req.query;
    const filter = { userId: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    const notifications = await Notification.find(filter).sort('-createdAt').limit(limit * 1).skip((page - 1) * limit);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
    res.json({ success: true, data: notification });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/notifications/mark-all-read
router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
