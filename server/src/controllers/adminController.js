const User = require('../models/User');
const Association = require('../models/Association');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Fund = require('../models/Fund');
const Group = require('../models/Group');
const Ground = require('../models/Ground');
const Sport = require('../models/Sport');
const Tournament = require('../models/Tournament');
const FriendlyMatch = require('../models/FriendlyMatch');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');
const { sendEmail } = require('../config/email');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getDashboardStats = async (req, res) => {
  const [
    totalUsers, totalAssociations, totalTeams, totalGrounds, totalSports,
    totalTournaments, totalFriendlyMatches, totalBookings, ongoingMatches,
    upcomingMatches, completedMatches, totalIncome, totalExpenses
  ] = await Promise.all([
    User.countDocuments(),
    Association.countDocuments(),
    Team.countDocuments(),
    Ground.countDocuments(),
    Sport.countDocuments({ isActive: true }),
    Tournament.countDocuments(),
    FriendlyMatch.countDocuments(),
    Booking.countDocuments(),
    Match.countDocuments({ status: 'live' }),
    Match.countDocuments({ status: 'scheduled' }),
    Match.countDocuments({ status: 'completed' }),
    Fund.aggregate([{ $match: { type: 'income' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Fund.aggregate([{ $match: { type: 'expense' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const activeUsers = await User.countDocuments({ status: 'active' });
  const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

  successResponse(res, {
    totalUsers,
    totalAssociations,
    totalTeams,
    totalGrounds,
    totalSports,
    totalTournaments,
    totalFriendlyMatches,
    totalBookings,
    ongoingMatches,
    upcomingMatches,
    completedMatches,
    totalRevenue: totalIncome[0]?.total || 0,
    totalExpenses: totalExpenses[0]?.total || 0,
    activeUsers,
    usersByRole,
  });
};

exports.createAssociation = async (req, res) => {
  const { name, headUserId, headName, headEmail, headPassword, address } = req.body;
  
  let head;
  if (headUserId) {
    head = await User.findById(headUserId);
    if (!head) return res.status(404).json({ success: false, message: 'Head user not found' });
  } else if (headEmail && headPassword) {
    const existingUser = await User.findOne({ email: headEmail });
    if (existingUser) {
      head = existingUser;
    } else {
      const namePart = headEmail.split('@')[0];
      const defaultName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      head = await User.create({
        name: headName || defaultName,
        email: headEmail,
        passwordHash: headPassword,
        role: 'association_head',
        status: 'active'
      });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Must provide either Head User ID or Head Email & Password' });
  }

  const association = await Association.create({ name, headUserId: head._id, address });
  
  head.role = 'association_head';
  head.associationId = association._id;
  await head.save();
  
  // Create association group chat
  await Group.create({ type: 'association', refId: association._id, name: `${name} Group`, members: [head._id] });
  
  await logAudit({
    action: 'association_created',
    performedBy: req.user._id,
    targetModel: 'Association',
    targetId: association._id,
    details: { name }
  });

  successResponse(res, association, 'Association created', 201);
};

exports.getAssociations = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query = search ? { name: { $regex: search, $options: 'i' } } : {};
  const total = await Association.countDocuments(query);
  const associations = await Association.find(query)
    .populate('headUserId', 'name email')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, associations, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.updateAssociation = async (req, res) => {
  const association = await Association.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('headUserId', 'name email');
  if (!association) return res.status(404).json({ success: false, message: 'Association not found' });

  await logAudit({
    action: 'association_updated',
    performedBy: req.user._id,
    targetModel: 'Association',
    targetId: association._id,
    details: req.body
  });

  successResponse(res, association, 'Association updated');
};

exports.deleteAssociation = async (req, res) => {
  const association = await Association.findById(req.params.id);
  if (!association) return res.status(404).json({ success: false, message: 'Association not found' });
  
  const assocName = association.name;
  await association.deleteOne();

  await logAudit({
    action: 'association_deleted',
    performedBy: req.user._id,
    targetModel: 'Association',
    targetId: req.params.id,
    details: { name: assocName }
  });

  successResponse(res, null, 'Association deleted');
};

exports.createUser = async (req, res) => {
  const { name, email, password, role, associationId, teamId, phone, username } = req.body;
  const user = await User.create({
    name, email, passwordHash: password, role,
    associationId: associationId || null,
    teamId: teamId || null,
    phone: phone || null,
    ...(username && { username }),
    status: 'active'
  });

  await logAudit({
    action: 'user_created',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: { name, email, role }
  });

  successResponse(res, user.toJSON(), 'User created', 201);
};

exports.getUsers = async (req, res) => {
  const { page = 1, limit = 10, role, associationId, status, search = '' } = req.query;
  const query = {};
  if (role) query.role = role;
  if (associationId) query.associationId = associationId;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('associationId', 'name')
    .populate('teamId', 'name')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, users, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.updateUser = async (req, res) => {
  const { name, role, status, associationId, teamId, phone, username, email } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const oldRole = user.role;
  user.name = name !== undefined ? name : user.name;
  user.role = role !== undefined ? role : user.role;
  user.status = status !== undefined ? status : user.status;
  user.associationId = associationId !== undefined ? (associationId || null) : user.associationId;
  user.teamId = teamId !== undefined ? (teamId || null) : user.teamId;
  user.phone = phone !== undefined ? phone : user.phone;
  user.username = username !== undefined ? username : user.username;
  user.email = email !== undefined ? email : user.email;

  await user.save();

  await logAudit({
    action: 'user_updated',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: {
      changedFields: req.body,
      roleChanged: oldRole !== user.role ? { from: oldRole, to: user.role } : null
    }
  });

  successResponse(res, user.toJSON(), 'User updated');
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await logAudit({
    action: 'user_deleted',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id
  });

  successResponse(res, null, 'User deactivated');
};

exports.bulkDeleteUsers = async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No user IDs provided' });
  }

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { $set: { status: 'inactive' } }
  );

  await logAudit({
    action: 'user_deleted',
    performedBy: req.user._id,
    details: { count: result.modifiedCount, userIds }
  });

  successResponse(res, { count: result.modifiedCount }, `${result.modifiedCount} users deactivated`);
};

exports.toggleUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await logAudit({
    action: status === 'suspended' ? 'user_suspended' : 'user_activated',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id,
    details: { status }
  });

  successResponse(res, user.toJSON(), `User status updated to ${status}`);
};

exports.resetUserPassword = async (req, res) => {
  const { newPassword, forceChange } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.passwordHash = newPassword || 'Reset@123';
  if (forceChange !== undefined) {
    user.forcePasswordChange = forceChange;
  }
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Password Reset by Admin',
    html: `<p>Your password has been reset. New password: <strong>${newPassword || 'Reset@123'}</strong></p><p>Please change it after login.</p>`,
  });

  await logAudit({
    action: 'password_reset',
    performedBy: req.user._id,
    targetUser: user._id,
    targetModel: 'User',
    targetId: user._id
  });

  successResponse(res, null, 'Password reset and email sent');
};

exports.getAuditLogs = async (req, res) => {
  const { page = 1, limit = 20, action, startDate, endDate } = req.query;
  const query = {};
  if (action) query.action = action;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .populate('targetUser', 'name email role')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  paginatedResponse(res, logs, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.exportAuditLogs = async (req, res) => {
  const { action, startDate, endDate, format = 'csv' } = req.query;
  const query = {};
  if (action) query.action = action;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(query)
    .populate('performedBy', 'name email role')
    .populate('targetUser', 'name email role')
    .sort({ createdAt: -1 })
    .limit(1000);

  if (format === 'json') {
    return res.json({ success: true, data: logs });
  }

  // Generate CSV
  const header = 'Timestamp,Action,Actor,Actor Role,Target User,Target Model,Target ID,Details\n';
  const rows = logs.map(l => {
    const timestamp = l.createdAt ? new Date(l.createdAt).toISOString() : '';
    const action = `"${(l.action || '').replace(/"/g, '""')}"`;
    const actor = `"${(l.performedBy?.name || l.performedBy?.email || 'System').replace(/"/g, '""')}"`;
    const actorRole = `"${(l.performedBy?.role || '').replace(/"/g, '""')}"`;
    const targetUser = `"${(l.targetUser?.name || l.targetUser?.email || '').replace(/"/g, '""')}"`;
    const targetModel = `"${(l.targetModel || '').replace(/"/g, '""')}"`;
    const targetId = `"${(l.targetId || '').toString().replace(/"/g, '""')}"`;
    const details = `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`;
    return [timestamp, action, actor, actorRole, targetUser, targetModel, targetId, details].join(',');
  }).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
  res.send(header + rows);
};

exports.sendAdminNotification = async (req, res) => {
  const { target, targetIds, message, type = 'general' } = req.body;
  
  let userQuery = {};
  if (target === 'association') {
    userQuery = { associationId: { $in: targetIds } };
  } else if (target === 'roles') {
    userQuery = { role: { $in: targetIds } };
  } else if (target === 'all') {
    userQuery = {};
  } else {
    return res.status(400).json({ success: false, message: 'Invalid target specified' });
  }

  const targetUsers = await User.find(userQuery, '_id associationId');
  if (targetUsers.length === 0) {
    return res.status(404).json({ success: false, message: 'No matching users found' });
  }

  const notifications = targetUsers.map(u => ({
    userId: u._id,
    type,
    message,
  }));

  await Notification.insertMany(notifications);

  // Emit to socket.io rooms
  const io = req.app.get('io');
  if (target === 'association') {
    targetIds.forEach(id => {
      io.to(`assoc:${id}`).emit('notification:new', { type, message });
    });
  } else {
    io.emit('notification:new', { type, message });
  }

  await logAudit({
    action: 'notification_sent',
    performedBy: req.user._id,
    details: { target, count: notifications.length, message }
  });

  successResponse(res, { count: notifications.length }, 'Notifications sent successfully');
};
