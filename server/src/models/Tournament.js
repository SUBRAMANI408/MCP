const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sport: { type: String, required: true },
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'ongoing', 'completed'],
    default: 'draft'
  },
  format: { type: String, enum: ['round_robin', 'knockout', 'group_knockout'], default: 'round_robin' },
  registrationStartDate: { type: Date },
  registrationDeadline: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date },
  registeredTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  maxTeams: { type: Number, default: 16 },
  description: { type: String },
  registrationFee: { type: Number, default: 0 },
  rules: { type: String },
  prizeInfo: { type: String },
  banner: { type: String },
  contactInfo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
