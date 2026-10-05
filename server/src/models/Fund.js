const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: ['membership_fee', 'tournament_fee', 'sponsorship', 'donation', 'expense', 'other'],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  relatedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', default: null },
  receiptStatus: { type: String, enum: ['generated', 'pending', 'failed'], default: 'generated' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'completed' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Fund', fundSchema);
