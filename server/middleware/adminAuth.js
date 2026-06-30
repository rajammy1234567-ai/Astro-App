const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminProtect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized as admin' });
    }
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Admin account inactive or not found' });
    }
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};

module.exports = { adminProtect };