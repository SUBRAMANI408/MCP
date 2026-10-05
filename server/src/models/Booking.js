const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  groundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ground', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'conflict'], default: 'pending' },
  priorityScore: { type: Number, default: 0 },
  scoreBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  alternateSlotProposal: { type: mongoose.Schema.Types.Mixed, default: null },
  waitlistPosition: { type: Number, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String },
  purpose: { type: String, enum: ['practice', 'tournament', 'friendly', 'other'], default: 'practice' },
}, { timestamps: true });

bookingSchema.index({ groundId: 1, date: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
