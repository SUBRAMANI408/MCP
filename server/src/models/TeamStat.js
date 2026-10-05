const mongoose = require('mongoose');

const teamStatSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  sport: { type: String, required: true },
  season: { type: String, default: 'all-time' },
  matchesPlayed: { type: Number, default: 0 },
  matchesPlayedHome: { type: Number, default: 0 },
  matchesPlayedAway: { type: Number, default: 0 },
  tournamentMatchesPlayed: { type: Number, default: 0 },
  friendlyMatchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  ties: { type: Number, default: 0 },
  noResults: { type: Number, default: 0 },
  winPercentage: { type: Number, default: 0 },
  recentForm: [{ type: String, enum: ['W', 'L', 'D', 'T', 'NR'] }], // Last 5 matches: ['W', 'W', 'L', 'W', 'D']
  groundUsageCount: { type: Map, of: Number, default: {} }, // groundId -> count
  trophiesWon: { type: Number, default: 0 },
}, { timestamps: true });

teamStatSchema.index({ teamId: 1, sport: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('TeamStat', teamStatSchema);
