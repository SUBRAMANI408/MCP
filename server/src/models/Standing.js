const mongoose = require('mongoose');

const standingSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  group: { type: String, default: 'A' }, // For group_knockout tournaments
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  tied: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  noResult: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  runsFor: { type: Number, default: 0 },
  oversFor: { type: Number, default: 0 },
  runsAgainst: { type: Number, default: 0 },
  oversAgainst: { type: Number, default: 0 },
  netRunRate: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  goalDifference: { type: Number, default: 0 },
  streak: [{ type: String, enum: ['W', 'L', 'T', 'D', 'NR'] }],
  rank: { type: Number, default: 0 },
  isQualified: { type: Boolean, default: false },
}, { timestamps: true });

standingSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('Standing', standingSchema);
