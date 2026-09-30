const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: { type: String, default: '' },
}, { timestamps: true });

invitationSchema.index({ playerId: 1, status: 1 });
invitationSchema.index({ teamId: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('Invitation', invitationSchema);
