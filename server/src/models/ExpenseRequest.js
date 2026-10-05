const mongoose = require('mongoose');

const expenseRequestSchema = new mongoose.Schema({
  associationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'ground_maintenance',
      'equipment',
      'equipment_purchase',
      'equipment_repair',
      'tournament_expense',
      'tournament_expenses',
      'umpire_fee',
      'refreshments',
      'travel_expense',
      'prize_distribution',
      'office_expense',
      'medical',
      'other'
    ],
    required: true,
  },
  amount: { type: Number, required: true, min: 1 },
  attachments: [{
    url: String,
    publicId: String,
    filename: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
    index: true,
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  paidAt: { type: Date, default: null },
  paymentRef: { type: String, default: null },
  rejectionReason: { type: String, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ExpenseRequest', expenseRequestSchema);
