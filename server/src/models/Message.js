const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'document', 'voice', 'audio', 'announcement'], default: 'text' },
  content: { type: String },
  mediaUrl: { type: String },
  mediaName: { type: String },
  mediaMimeType: { type: String },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [reactionSchema],
  pinned: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  editHistory: [{ content: String, editedAt: Date }],
  isAnnouncement: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, pinned: 1 });

module.exports = mongoose.model('Message', messageSchema);
