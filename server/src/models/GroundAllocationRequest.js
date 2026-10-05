const mongoose = require('mongoose');

const groundAllocationRequestSchema = new mongoose.Schema({
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', default: null },
  purpose: {
    type: String,
    enum: ['tournament', 'practice', 'friendly', 'coaching', 'maintenance'],
    default: 'practice',
  },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },

  // Fair-allocation scoring components (§41 & Phase 5)
  priorityScore: { type: Number, default: 0 },
  scoreBreakdown: {
    matchesPlayedInWindow: { type: Number, default: 0 },
    groundUsageCount30d: { type: Number, default: 0 },
    requestTimestamp: { type: Date, default: Date.now },
    isTournamentMatch: { type: Boolean, default: false },
    rotationIndex: { type: Number, default: 0 },
    computedScore: { type: Number, default: 0 },
  },

  decision: {
    type: String,
    enum: ['pending', 'allocated', 'rejected', 'alternate_proposed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  decisionReason: { type: String, default: '' },
  officerOverride: { type: Boolean, default: false },
  overrideReason: { type: String, default: null },

  alternateSlotProposals: [{
    groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground' },
    date: Date,
    startTime: String,
    endTime: String,
    status: { type: String, enum: ['proposed', 'accepted', 'declined'], default: 'proposed' },
  }],

  resultingBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { timestamps: true });

module.exports = mongoose.model('GroundAllocationRequest', groundAllocationRequestSchema);
