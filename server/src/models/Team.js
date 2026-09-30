const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true },
  captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viceCaptainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sport: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  friendlyMatchesPlayed: { type: Number, default: 0 },
  tournamentMatchesPlayed: { type: Number, default: 0 },
  logo: { type: String, default: null },
  description: { type: String, default: '' },
  rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
