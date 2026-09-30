const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  appName: { type: String, default: 'Digital Sports Association Platform' },
  logo: { type: String, default: null },
  emailSettings: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
  },
  notificationSettings: {
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    inAppEnabled: { type: Boolean, default: true },
  },
  securitySettings: {
    passwordMinLength: { type: Number, default: 6 },
    sessionTimeout: { type: Number, default: 24 },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 },
  },
  fileUploadLimits: {
    maxSizeBytes: { type: Number, default: 10485760 },
    allowedTypes: { type: [String], default: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'] },
  },
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
