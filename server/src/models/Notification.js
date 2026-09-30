const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'team_approved', 'team_rejected', 'booking_approved', 'booking_rejected',
      'tournament_approved', 'tournament_rejected', 'match_started', 'match_completed',
      'friendly_request', 'friendly_accepted', 'friendly_rejected',
      'expense_approved', 'expense_rejected', 'announcement', 'general',
      'team_invite', 'team_invite_response'
    ]
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  refId: { type: mongoose.Schema.Types.ObjectId },
  refModel: { type: String },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
