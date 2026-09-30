const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  type: { type: String, enum: ['association', 'team'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  announcements: [{
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  lastMessage: {
    content: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
