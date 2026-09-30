const SystemConfig = require('../models/SystemConfig');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getConfig = async (req, res) => {
  let config = await SystemConfig.findOne({ key: 'main' });
  if (!config) {
    config = await SystemConfig.create({ key: 'main' });
  }
  successResponse(res, config);
};

exports.updateConfig = async (req, res) => {
  let config = await SystemConfig.findOneAndUpdate(
    { key: 'main' },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  await logAudit({
    action: 'system_config_updated',
    performedBy: req.user._id,
    details: req.body
  });

  successResponse(res, config, 'System configuration updated');
};

exports.getFeedback = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const total = await Feedback.countDocuments(query);
  const feedbacks = await Feedback.find(query)
    .populate('userId', 'name email role')
    .populate('repliedBy', 'name email')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  paginatedResponse(res, feedbacks, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.replyToFeedback = async (req, res) => {
  const { adminReply } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

  feedback.adminReply = adminReply;
  feedback.repliedBy = req.user._id;
  feedback.repliedAt = new Date();
  feedback.status = 'in_progress';
  await feedback.save();

  await logAudit({
    action: 'feedback_replied',
    performedBy: req.user._id,
    targetModel: 'Feedback',
    targetId: feedback._id,
    details: { adminReply }
  });

  successResponse(res, feedback, 'Reply submitted');
};

exports.resolveFeedback = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

  feedback.status = 'resolved';
  await feedback.save();

  await logAudit({
    action: 'feedback_resolved',
    performedBy: req.user._id,
    targetModel: 'Feedback',
    targetId: feedback._id
  });

  successResponse(res, feedback, 'Feedback marked as resolved');
};

exports.forceLogoutUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Soft force logout: suspend the user temporarily or trigger token invalidation by updating user status
  const originalStatus = user.status;
  user.status = 'suspended';
  await user.save();

  // Audit log
  await logAudit({
    action: 'force_logout',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: { originalStatus }
  });

  // Re-activate immediately so they can re-login, but their previous token would fail if status mismatch
  // Or keep it suspended for security. Let's make it simple: suspend them, admin can reactivate.
  successResponse(res, null, 'User session terminated. Account suspended.');
};

exports.getLoginAttempts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const query = { action: 'login_failed' };
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('targetUser', 'name email role')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  paginatedResponse(res, logs, { total, page: Number(page), pages: Math.ceil(total / limit) });
};
