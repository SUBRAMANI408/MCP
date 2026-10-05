const mongoose = require('mongoose');

const playerStatSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sport: { type: String, required: true, index: true },
  season: { type: String, default: 'all-time', index: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },

  // General
  matches: { type: Number, default: 0 },
  playerOfTheMatchCount: { type: Number, default: 0 },

  // Cricket
  cricket: {
    innings: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    notOuts: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    battingAverage: { type: Number, default: 0 },
    oversBowled: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    bestBowling: { wickets: { type: Number, default: 0 }, runs: { type: Number, default: 0 } },
    economy: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 },
  },

  // Football
  football: {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 },
  },

  // Basketball
  basketball: {
    points: { type: Number, default: 0 },
    rebounds: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    fouls: { type: Number, default: 0 },
    steals: { type: Number, default: 0 },
    blocks: { type: Number, default: 0 },
  },

  // Volleyball & Kabaddi
  volleyball: {
    aces: { type: Number, default: 0 },
    kills: { type: Number, default: 0 },
    blocks: { type: Number, default: 0 },
    digs: { type: Number, default: 0 },
  },
  kabaddi: {
    raidPoints: { type: Number, default: 0 },
    tacklePoints: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    superRaids: { type: Number, default: 0 },
    superTackles: { type: Number, default: 0 },
  },

  // Generic sport points
  customPoints: { type: Number, default: 0 },
}, { timestamps: true });

playerStatSchema.index({ playerId: 1, sport: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('PlayerStat', playerStatSchema);
