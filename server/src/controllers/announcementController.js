const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.createAnnouncement = async (req, res) => {
  const { associationId, title, body, priority, type, scheduledAt } = req.body;
  const announcement = await Announcement.create({
    associationId: associationId || null,
    title,
    body,
    postedBy: req.user._id,
    priority: priority || 'medium',
    type: type || 'general',
    scheduledAt: scheduledAt || null,
  });

  // Notify members
  const memberQuery = associationId ? { associationId } : {};
  const members = await User.find(memberQuery, '_id');
  const notifications = members.map(m => ({
    userId: m._id,
    type: 'announcement',
    message: `New announcement: ${title}`,
    refId: announcement._id,
    refModel: 'Announcement',
  }));

  if (notifications.length > 0) await Notification.insertMany(notifications);
  
  const io = req.app.get('io');
  if (associationId) {
    io.to(`assoc:${associationId}`).emit('notification:new', { type: 'announcement', announcementId: announcement._id });
  } else {
    io.emit('notification:new', { type: 'announcement', announcementId: announcement._id });
  }

  successResponse(res, announcement, 'Announcement created', 201);
};

exports.getAnnouncements = async (req, res) => {
  const { associationId, page = 1, limit = 10 } = req.query;
  const query = {};
  if (associationId) query.associationId = associationId;
  const total = await Announcement.countDocuments(query);
  const announcements = await Announcement.find(query)
    .populate('postedBy', 'name')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, announcements, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('postedBy', 'name avatar');
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  successResponse(res, announcement);
};

exports.updateAnnouncement = async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  successResponse(res, announcement, 'Announcement updated');
};

exports.deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  successResponse(res, null, 'Announcement deleted');
};
