const mongoose = require('mongoose');

const friendlyMatchSchema = new mongoose.Schema({
  requestingTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  respondingTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground', default: null },
  date: { type: Date },
  time: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  message: { type: String },
  sport: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('FriendlyMatch', friendlyMatchSchema);
