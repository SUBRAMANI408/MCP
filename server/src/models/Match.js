const mongoose = require('mongoose');

const ballSchema = new mongoose.Schema({
  ballNum: Number,
  over: Number,
  runs: { type: Number, default: 0 },
  extraType: { type: String, enum: ['wide', 'no_ball', 'bye', 'leg_bye', 'penalty', null], default: null },
  extraRuns: { type: Number, default: 0 },
  isWicket: { type: Boolean, default: false },
  wicketType: { type: String, enum: ['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', null], default: null },
  batsmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bowlerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fielderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isBoundary: { type: Boolean, default: false },
  isSix: { type: Boolean, default: false },
  commentary: String,
}, { _id: false });

const inningSchema = new mongoose.Schema({
  battingTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  bowlingTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  totalRuns: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: { type: Number, default: 0 },
  balls: [ballSchema],
  extras: {
    wide: { type: Number, default: 0 },
    noBall: { type: Number, default: 0 },
    bye: { type: Number, default: 0 },
    legBye: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  partnerships: [{ batsman1Id: mongoose.Schema.Types.ObjectId, batsman2Id: mongoose.Schema.Types.ObjectId, runs: Number, balls: Number }],
  fallOfWickets: [{ wicket: Number, runs: Number, batsmanId: mongoose.Schema.Types.ObjectId, over: Number }],
  completed: { type: Boolean, default: false },
  targetRuns: Number,
}, { _id: false });

const matchEventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: { type: String, required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  type: { type: String, enum: ['tournament', 'friendly'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  fixtureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', default: null },
  friendlyMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendlyMatch', default: null },
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchResult', default: null },
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground' },
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association' },
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
  scheduledAt: { type: Date },

  // Pre-match setup
  tossWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  tossDecision: { type: String, enum: ['bat', 'bowl', null], default: null },
  totalOvers: { type: Number, default: 20 },
  ballType: { type: String, default: 'leather' },
  numPlayers: { type: Number, default: 11 },

  // Lineups & Active Cricket State (Phase 3.1)
  playingXI: {
    teamA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teamB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  currentBatsmen: {
    strikerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    nonStrikerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  currentBowlerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  previousBowlerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Cricket innings
  innings: [inningSchema],
  currentInning: { type: Number, default: 0 },

  // General score summary (all sports)
  scoreSummary: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Events log (football, basketball, volleyball, kabaddi)
  events: [matchEventSchema],

  // Match officials and result
  scorerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  scorerLockedAt: { type: Date },
  playerOfMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  resultSummary: { type: String },

  startedAt: { type: Date },
  endedAt: { type: Date },
}, { timestamps: true });

matchSchema.index({ status: 1 });
matchSchema.index({ teamA: 1, teamB: 1 });
matchSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Match', matchSchema);
