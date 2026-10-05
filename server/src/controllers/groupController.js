const Group = require('../models/Group');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

/* ─── Group management ─────────────────────────────────────────────────────── */

exports.getGroup = async (req, res) => {
  let group = await Group.findById(req.params.id)
    .populate('members', 'name email avatar role status')
    .populate('adminIds', 'name')
    .populate('pinnedMessages');
    
  if (!group) {
    // Try to lookup Team by id. If it exists, create the team group chat dynamically.
    const Team = require('../models/Team');
    const team = await Team.findById(req.params.id);
    if (team) {
      group = await Group.create({
        type: 'team',
        refId: team._id,
        _id: team._id, // Assign matching ID so the route resolves correctly
        name: `${team.name} Group`,
        members: team.players,
        adminIds: [team.captainId],
      });
      group = await Group.findById(group._id)
        .populate('members', 'name email avatar role status')
        .populate('adminIds', 'name')
        .populate('pinnedMessages');
    }
  }

  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  const isMember = group.members.some(m => {
    const id = m._id || m;
    return id.toString() === req.user._id.toString();
  });
  if (!isMember) return res.status(403).json({ success: false, message: 'Access denied: You are not a member of this chat group' });
  successResponse(res, group);
};

exports.updateGroup = async (req, res) => {
  const { name, description, avatar } = req.body;
  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), ...(description !== undefined && { description }), ...(avatar !== undefined && { avatar }) },
    { new: true }
  ).populate('members', 'name email avatar role');
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  const io = req.app.get('io');
  io.to(`group:${req.params.id}`).emit('group:updated', group);
  successResponse(res, group, 'Group updated');
};

exports.getMyGroups = async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .select('name type avatar lastMessage members')
    .populate('members', 'name avatar')
    .sort({ updatedAt: -1 });
  successResponse(res, groups);
};

/* ─── Messages ─────────────────────────────────────────────────────────────── */

exports.getMessages = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const total = await Message.countDocuments({ groupId: req.params.id, deleted: false });
  const messages = await Message.find({ groupId: req.params.id, deleted: false })
    .populate('senderId', 'name avatar role')
    .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'name' } })
    .populate('forwardedFrom', 'content senderId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  paginatedResponse(res, messages.reverse(), { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.sendMessage = async (req, res) => {
  const { content, type, mediaUrl, mediaName, mediaMimeType, replyTo } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  const isMember = group.members.map(m => m.toString()).includes(req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'You are not a member of this group' });

  const message = await Message.create({
    groupId: req.params.id,
    senderId: req.user._id,
    type: type || 'text',
    content, mediaUrl, mediaName, mediaMimeType,
    replyTo: replyTo || null,
    readBy: [req.user._id],
    deliveredTo: [req.user._id],
  });

  // Update group lastMessage
  await Group.findByIdAndUpdate(req.params.id, {
    lastMessage: { content: content || `📎 ${type}`, senderId: req.user._id, sentAt: new Date() }
  });

  const populated = await Message.findById(message._id)
    .populate('senderId', 'name avatar role')
    .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'name' } });

  const io = req.app.get('io');
  io.to(`group:${req.params.id}`).emit('message:new', populated);

  successResponse(res, populated, 'Message sent', 201);
};

exports.editMessage = async (req, res) => {
  const { content } = req.body;
  const message = await Message.findById(req.params.msgId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  if (message.senderId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
  }
  if (message.type !== 'text') return res.status(400).json({ success: false, message: 'Only text messages can be edited' });

  // Store history
  message.editHistory = message.editHistory || [];
  message.editHistory.push({ content: message.content, editedAt: new Date() });
  message.content = content;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const io = req.app.get('io');
  io.to(`group:${message.groupId}`).emit('message:edited', {
    messageId: message._id, content, editedAt: message.editedAt
  });
  successResponse(res, message, 'Message edited');
};

exports.forwardMessage = async (req, res) => {
  const { targetGroupId } = req.body;
  const original = await Message.findById(req.params.msgId);
  if (!original) return res.status(404).json({ success: false, message: 'Message not found' });

  const group = await Group.findById(targetGroupId);
  if (!group) return res.status(404).json({ success: false, message: 'Target group not found' });
  const isMember = group.members.map(m => m.toString()).includes(req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of target group' });

  const forwarded = await Message.create({
    groupId: targetGroupId,
    senderId: req.user._id,
    type: original.type,
    content: original.content,
    mediaUrl: original.mediaUrl,
    mediaName: original.mediaName,
    forwardedFrom: original._id,
    readBy: [req.user._id],
    deliveredTo: [req.user._id],
  });

  await Group.findByIdAndUpdate(targetGroupId, {
    lastMessage: { content: original.content || '📎 Forwarded', senderId: req.user._id, sentAt: new Date() }
  });

  const populated = await forwarded.populate('senderId', 'name avatar role');
  const io = req.app.get('io');
  io.to(`group:${targetGroupId}`).emit('message:new', populated);
  successResponse(res, populated, 'Message forwarded', 201);
};

exports.addReaction = async (req, res) => {
  const { emoji } = req.body;
  const message = await Message.findById(req.params.msgId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

  const existing = message.reactions.find(r => r.userId?.toString() === req.user._id.toString());
  if (existing) {
    existing.emoji = emoji; // update existing reaction
  } else {
    message.reactions.push({ emoji, userId: req.user._id });
  }
  await message.save();

  const io = req.app.get('io');
  io.to(`group:${message.groupId}`).emit('message:reaction', {
    messageId: message._id, reactions: message.reactions
  });
  successResponse(res, message.reactions);
};

exports.removeReaction = async (req, res) => {
  const message = await Message.findById(req.params.msgId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  message.reactions = message.reactions.filter(r => r.userId?.toString() !== req.user._id.toString());
  await message.save();
  const io = req.app.get('io');
  io.to(`group:${message.groupId}`).emit('message:reaction', {
    messageId: message._id, reactions: message.reactions
  });
  successResponse(res, message.reactions);
};

exports.pinMessage = async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.msgId,
    [{ $set: { pinned: { $not: '$pinned' } } }],
    { new: true }
  );
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

  if (message.pinned) {
    await Group.findByIdAndUpdate(message.groupId, { $addToSet: { pinnedMessages: message._id } });
  } else {
    await Group.findByIdAndUpdate(message.groupId, { $pull: { pinnedMessages: message._id } });
  }

  const io = req.app.get('io');
  io.to(`group:${message.groupId}`).emit('message:pinned', { messageId: message._id, pinned: message.pinned });
  successResponse(res, message, message.pinned ? 'Message pinned' : 'Message unpinned');
};

exports.getPinnedMessages = async (req, res) => {
  const messages = await Message.find({ groupId: req.params.id, pinned: true, deleted: false })
    .populate('senderId', 'name avatar')
    .sort({ updatedAt: -1 });
  successResponse(res, messages);
};

exports.markRead = async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.msgId,
    { $addToSet: { readBy: req.user._id } },
    { new: true }
  );
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
  successResponse(res, message);
};

exports.markAllRead = async (req, res) => {
  await Message.updateMany(
    { groupId: req.params.id, readBy: { $ne: req.user._id }, deleted: false },
    { $addToSet: { readBy: req.user._id } }
  );
  successResponse(res, null, 'All messages marked as read');
};

exports.searchMessages = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Search query required' });
  const messages = await Message.find({
    groupId: req.params.id,
    content: { $regex: q, $options: 'i' },
    deleted: false,
  }).populate('senderId', 'name avatar').sort({ createdAt: -1 }).limit(50);
  successResponse(res, messages);
};

exports.deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.msgId);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

  const isOwner = message.senderId.toString() === req.user._id.toString();
  const isModerator = req.user.role === 'admin' || req.user.role === 'association_head';

  if (!isOwner && !isModerator) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
  }

  message.deleted = true;
  message.content = isModerator && !isOwner ? 'This message was deleted by a moderator' : 'This message was deleted';
  message.mediaUrl = null;
  await message.save();

  const io = req.app.get('io');
  if (io) io.to(`group:${message.groupId}`).emit('message:deleted', { messageId: message._id, content: message.content });
  successResponse(res, null, 'Message deleted');
};

/* ─── Group Announcements ──────────────────────────────────────────────────── */

exports.postAnnouncement = async (req, res) => {
  const { content } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  group.announcements.push({ content, postedBy: req.user._id, createdAt: new Date() });
  await group.save();

  // Also create as pinned announcement message
  const msg = await Message.create({
    groupId: req.params.id,
    senderId: req.user._id,
    type: 'announcement',
    content,
    isAnnouncement: true,
    pinned: true,
    readBy: [req.user._id],
    deliveredTo: [req.user._id],
  });

  const populated = await msg.populate('senderId', 'name avatar role');
  const io = req.app.get('io');
  io.to(`group:${req.params.id}`).emit('message:new', populated);
  io.to(`group:${req.params.id}`).emit('group:announcement', { content, postedBy: req.user.name });

  successResponse(res, { announcement: group.announcements[group.announcements.length - 1], message: populated }, 'Announcement posted');
};

exports.getAnnouncements = async (req, res) => {
  const group = await Group.findById(req.params.id)
    .select('announcements')
    .populate('announcements.postedBy', 'name avatar');
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  successResponse(res, group.announcements);
};
