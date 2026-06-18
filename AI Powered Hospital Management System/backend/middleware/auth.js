const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Verify JWT Token
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};

// Audit Logger Middleware
exports.auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (data.success !== false) {
        try {
          await AuditLog.create({
            userId: req.user?._id,
            userEmail: req.user?.email || 'anonymous',
            userRole: req.user?.role || 'anonymous',
            action,
            resource,
            resourceId: req.params.id || data?.data?._id || null,
            details: `${action} ${resource}`,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: 'success'
          });
        } catch (e) { /* non-critical */ }
      }
      return originalJson(data);
    };
    next();
  };
};
