const jwt = require('jsonwebtoken');
const Astrologer = require('../models/Astrologer');

const astroProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Astrologer authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'astrologer') {
      return res.status(401).json({ message: 'Not authorized as astrologer' });
    }
    const astrologer = await Astrologer.findById(decoded.id).select('-password');
    if (!astrologer) {
      return res.status(401).json({ message: 'Astrologer account not found' });
    }
    if (astrologer.isBlocked) {
      return res.status(403).json({ message: astrologer.blockReason || 'Account blocked by admin' });
    }
    if (astrologer.credentialsActive === false) {
      return res.status(403).json({
        message:
          astrologer.credentialsDeactivatedReason ||
          'Login credentials deactivated by admin',
      });
    }
    req.astrologer = astrologer;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired astrologer token' });
  }
};

module.exports = { astroProtect };