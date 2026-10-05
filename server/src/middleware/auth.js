const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    if (!user || user.status === 'inactive' || user.status === 'suspended') {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Direct role match
    if (roles.includes(req.user.role)) {
      return next();
    }

    // Phase 10: Temporary Tournament Organizer permission delegation (§5)
    if (
      roles.includes('tournament_organizer') &&
      req.user.tempOrganizer?.isTemp &&
      req.user.tempOrganizer?.status === 'active'
    ) {
      if (req.user.tempOrganizer.endTime && new Date(req.user.tempOrganizer.endTime) < new Date()) {
        req.user.tempOrganizer.status = 'expired';
        req.user.save().catch(() => {});
        return res.status(403).json({
          success: false,
          message: 'Temporary tournament organizer authorization has expired'
        });
      }
      return next();
    }

    // Phase 10: Vice-captain delegated permissions for captain operations (§15)
    if (roles.includes('captain') && req.user.role === 'vice_captain') {
      if (req.user.teamId) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to access this route`
    });
  };
};

module.exports = { authenticate, authorize };
