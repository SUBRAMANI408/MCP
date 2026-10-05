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

const RefreshToken = require('../models/RefreshToken');
const LoginAttempt = require('../models/LoginAttempt');

exports.forceLogoutUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Revoke all active refresh tokens for this user
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  // Notify connected sockets to force disconnect
  const io = req.app.get('io');
  if (io) {
    io.to(user._id.toString()).emit('auth:forced_logout', { message: 'Your session was terminated by an administrator.' });
  }

  await logAudit({
    action: 'force_logout',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: { reason: 'Admin revoked sessions' }
  });

  successResponse(res, null, 'User sessions revoked. User will be required to log in again.');
};

exports.lockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.status = 'suspended';
  await user.save();

  // Also revoke active sessions
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  await logAudit({
    action: 'user_locked',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: { action: 'Account locked / suspended' }
  });

  successResponse(res, user.toJSON(), 'User account locked and suspended');
};

exports.unlockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.status = 'active';
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await logAudit({
    action: 'user_unlocked',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: { action: 'Account unlocked and re-activated' }
  });

  successResponse(res, user.toJSON(), 'User account unlocked and re-activated');
};

exports.getLoginAttempts = async (req, res) => {
  const { page = 1, limit = 20, email, success } = req.query;
  
  const query = {};
  if (email) query.email = { $regex: email, $options: 'i' };
  if (success !== undefined) query.success = success === 'true';

  const total = await LoginAttempt.countDocuments(query);
  const attempts = await LoginAttempt.find(query)
    .populate('userId', 'name email role')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  paginatedResponse(res, attempts, { total, page: Number(page), pages: Math.ceil(total / limit) });
};
