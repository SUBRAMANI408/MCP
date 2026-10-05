const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '30d' }, // Auto-delete expired after 30d
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  replacedByToken: {
    type: String,
    default: null,
  },
}, { timestamps: true });

refreshTokenSchema.methods.isValid = function () {
  return !this.revokedAt && new Date() < this.expiresAt;
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
