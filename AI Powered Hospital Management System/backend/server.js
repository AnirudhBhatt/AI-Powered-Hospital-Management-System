const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/v1/auth', authLimiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auto-create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/patients', require('./routes/patients'));
app.use('/api/v1/doctors', require('./routes/doctors'));
app.use('/api/v1/appointments', require('./routes/appointments'));
app.use('/api/v1/prescriptions', require('./routes/prescriptions'));
app.use('/api/v1/medical-records', require('./routes/medicalRecords'));
app.use('/api/v1/lab-tests', require('./routes/labTests'));
app.use('/api/v1/medicines', require('./routes/medicines'));
app.use('/api/v1/invoices', require('./routes/invoices'));
app.use('/api/v1/rooms', require('./routes/rooms'));
app.use('/api/v1/emergency', require('./routes/emergency'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/audit-logs', require('./routes/auditLogs'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Multer error handling
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  next(err);
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 HMS Backend running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

module.exports = app;
