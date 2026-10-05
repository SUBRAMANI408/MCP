const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
  round: { type: Number, required: true },
  roundName: { type: String },
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  sourceFixtureA: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', default: null },
  sourceFixtureB: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', default: null },
  group: { type: String, default: null },
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground', default: null },
  scheduledDate: { type: Date },
  scheduledTime: { type: String },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'postponed'], default: 'scheduled' },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Fixture', fixtureSchema);
