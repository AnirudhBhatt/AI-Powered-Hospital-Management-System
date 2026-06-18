const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const { protect, authorize, auditLog } = require('../middleware/auth');

// @route GET /api/v1/invoices
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) filter.patientId = patient._id;
    }
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const invoices = await Invoice.find(filter).populate('patientId', 'name patientId phone').sort('-createdAt');
    res.json({ success: true, data: invoices });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route POST /api/v1/invoices
router.post('/', protect, authorize('billing_executive', 'hospital_admin', 'super_admin'), auditLog('CREATE', 'Invoice'), async (req, res) => {
  try {
    const invoiceId = `INV-${Date.now()}`;
    const { items, discount = 0 } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + tax - discount;
    const invoice = await Invoice.create({ ...req.body, invoiceId, subtotal, tax, totalAmount, createdBy: req.user._id });

    const patient = await Patient.findById(req.body.patientId);
    if (patient) {
      await Notification.create({ userId: patient.userId, title: 'New Invoice Generated', message: `Invoice #${invoiceId} for ₹${totalAmount.toFixed(2)} has been generated`, type: 'billing', priority: 'medium' });
    }
    res.status(201).json({ success: true, data: invoice });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route GET /api/v1/invoices/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('patientId', 'name patientId phone address insurance');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/invoices/:id/pay
router.patch('/:id/pay', protect, authorize('billing_executive', 'hospital_admin', 'patient'), auditLog('UPDATE', 'Invoice'), async (req, res) => {
  try {
    const { paymentMethod, method, paidAmount, amount, transactionId } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    const newPayment = parseFloat(paidAmount || amount || 0);
    invoice.paymentMethod = paymentMethod || method || 'Cash';
    if (transactionId) invoice.transactionId = transactionId;
    
    invoice.paidAmount = (invoice.paidAmount || 0) + newPayment;
    invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'Paid' : 'Partial';
    invoice.paidAt = new Date();
    
    await invoice.save();
    res.json({ success: true, data: invoice });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route PATCH /api/v1/invoices/:id/insurance-claim
router.patch('/:id/insurance-claim', protect, authorize('billing_executive', 'hospital_admin'), auditLog('UPDATE', 'Invoice'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { insurance: req.body }, { new: true });
    res.json({ success: true, data: invoice });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
