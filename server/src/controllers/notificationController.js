const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = { userId: req.user._id };
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit).limit(Number(limit));
  paginatedResponse(res, notifications, { total, unreadCount, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  successResponse(res, notification);
};

exports.markAllAsRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  successResponse(res, null, 'All notifications marked as read');
};

exports.deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  successResponse(res, null, 'Notification deleted');
};

const NotificationPreference = require('../models/NotificationPreference');

exports.getPreferences = async (req, res) => {
  let prefs = await NotificationPreference.findOne({ userId: req.user._id });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId: req.user._id });
  }
  successResponse(res, prefs);
};

exports.updatePreferences = async (req, res) => {
  const prefs = await NotificationPreference.findOneAndUpdate(
    { userId: req.user._id },
    req.body,
    { new: true, upsert: true }
  );
  successResponse(res, prefs, 'Notification preferences updated');
};

exports.registerDeviceToken = async (req, res) => {
  const { token, platform = 'web' } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Device token required' });

  const prefs = await NotificationPreference.findOneAndUpdate(
    { userId: req.user._id },
    { $addToSet: { deviceTokens: { token, platform, updatedAt: new Date() } } },
    { new: true, upsert: true }
  );
  successResponse(res, prefs, 'Device token registered');
};
