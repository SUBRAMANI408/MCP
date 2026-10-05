const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  inAppNotifications: { type: Boolean, default: true },
  matchUpdates: { type: Boolean, default: true },
  bookingAlerts: { type: Boolean, default: true },
  financialAlerts: { type: Boolean, default: true },
  chatAlerts: { type: Boolean, default: true },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '07:00' },
  },
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    updatedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
