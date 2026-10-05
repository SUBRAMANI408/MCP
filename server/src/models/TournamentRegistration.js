const mongoose = require('mongoose');

const tournamentRegistrationSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending',
    index: true,
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, default: null },
  registrationFeeStatus: {
    type: String,
    enum: ['exempt', 'unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  rosterSnapshot: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String,
    jerseyNumber: Number,
  }],
}, { timestamps: true });

tournamentRegistrationSchema.index({ tournamentId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('TournamentRegistration', tournamentRegistrationSchema);
