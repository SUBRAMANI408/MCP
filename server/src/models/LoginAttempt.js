const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  success: {
    type: Boolean,
    required: true,
  },
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  reason: {
    type: String,
    default: '',
  },
}, { timestamps: true });

loginAttemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
