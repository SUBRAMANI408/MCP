const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  adminReply: { type: String, default: null },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  repliedAt: { type: Date, default: null },
}, { timestamps: true });

feedbackSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
