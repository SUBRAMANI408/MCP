const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['practice', 'meeting', 'trial', 'fitness', 'social'],
    default: 'practice',
  },
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground', default: null },
  locationText: { type: String, default: '' },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['attending', 'declined', 'tentative'], default: 'attending' },
  }],
  visibility: {
    type: String,
    enum: ['team_only', 'public', 'association'],
    default: 'team_only',
  },
}, { timestamps: true });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);
