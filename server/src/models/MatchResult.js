const mongoose = require('mongoose');

const matchResultSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, unique: true, index: true },
  winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  loserTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  resultType: {
    type: String,
    enum: ['win', 'tie', 'draw', 'no_result', 'abandoned', 'walkover'],
    required: true,
  },
  marginText: { type: String, default: '' }, // e.g., "by 4 wickets", "3 - 1"
  marginValue: { type: Number, default: 0 },
  inningsSummary: [{
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    score: mongoose.Schema.Types.Mixed,
  }],
  playerOfMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  finalizedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MatchResult', matchResultSchema);
