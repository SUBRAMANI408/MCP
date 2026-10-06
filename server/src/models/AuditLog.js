const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_created', 'user_updated', 'user_deleted', 'user_suspended', 'user_activated',
      'password_reset', 'role_changed', 'login_success', 'login_failed',
      'association_created', 'association_updated', 'association_deleted',
      'sport_created', 'sport_updated', 'sport_deleted', 'sport_toggled',
      'ground_created', 'ground_updated', 'ground_deleted', 'ground_booking_toggled',
      'announcement_created', 'announcement_updated', 'announcement_deleted',
      'notification_sent',
      'tournament_created', 'tournament_updated',
      'booking_created', 'booking_approved', 'booking_rejected',
      'fund_created', 'fund_approved',
      'system_config_updated',
      'feedback_replied', 'feedback_resolved',
      'force_logout', 'account_locked', 'account_unlocked',
      'expense_requested', 'expense_approved', 'expense_rejected', 'expense_paid',
      'team_approved', 'team_rejected', 'team_suspended', 'team_reactivated', 'team_corrections_requested',
      'user_locked', 'user_unlocked'
    ]
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetModel: { type: String, default: null },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
}, { timestamps: true });

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ targetUser: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
