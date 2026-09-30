const AuditLog = require('../models/AuditLog');

const logAudit = async ({ action, performedBy, targetUser = null, targetModel = null, targetId = null, details = {}, ipAddress = null }) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetUser,
      targetModel,
      targetId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAudit };
